import * as winston from "winston"
import {
    Project, TaskDefinition, TaskRelation, Modifier, DelayDefinition, DelayRelation
} from "../../common/types"
import { IDataProvider, isKnownError } from "../core/data/idataprovider"
import { IGraph, IProjectNode, ITaskNode, IDelayNode, GraphError } from "../core/graph/types"
import { findCyclicDependency } from "../core/graph/analyzer"
import {
    ApiTask, ApiTaskResults, ApiDelay, createProject, createTask, createApiTask, createApiDelay,
    createTaskRelation, createDelay, createDelayRelation
} from "../../common/apitypes"
import { NotFoundError, ExistsError, InputError } from "../../common/errors"
import * as maputils from "../../common/maputils"

interface ErrorJson {
    error: string
}

const isApiKnownError = (error: Error): boolean => {
    return isKnownError(error) || error instanceof GraphError
}

export class RequestError extends Error implements Error {
    status: number
    json: ErrorJson
    constructor(status: number, message: string) {
        super(message)
        this.status = status
        this.json = { error: message }
    }
}

export class Api {
    private dataProvider: IDataProvider
    private graph: IGraph
    constructor(dataProvider: IDataProvider, graph: IGraph) {
        this.dataProvider = dataProvider
        this.graph = graph
    }
    getProjects(): Promise<Array<Project>> {
        return this.dataProvider.getAllProjects().catch((error: Error) => {
            winston.error(error.message)
            if (isApiKnownError(error)) {
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
    getProject(projectIdentifier: any): Promise<Project> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        return this.dataProvider.getProject(projectIdentifier).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
    getProjectTasks(projectIdentifier: any): Promise<Array<ApiTask>> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        return this.dataProvider.getProjectTasks(projectIdentifier).then((tasks: Array<TaskDefinition>) => {
            const projectNode = maputils.get(this.graph.nodes, projectIdentifier)
            const returned: Array<ApiTask> = tasks.map((task: TaskDefinition) => {
                let taskNode = maputils.get(projectNode.nodes, task.identifier)
                return createApiTask(task, taskNode.startDate, taskNode.duration)
            })
            return returned
        }).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
    getProjectDelays(projectIdentifier: any): Promise<Array<ApiDelay>> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        return this.dataProvider.getProjectDelays(projectIdentifier).then((delays: Array<DelayDefinition>) => {
            const projectNode = maputils.get(this.graph.nodes, projectIdentifier)
            const returned: Array<ApiDelay> = delays.map((delay: DelayDefinition) => {
                let delayNode = maputils.get(projectNode.delays, delay.identifier)
                return createApiDelay(delay, delayNode.initialMargin, delayNode.margin)
            })
            return returned
        }).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
    getTask(projectIdentifier: any, taskIdentifier: any): Promise<ApiTaskResults> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        if (typeof taskIdentifier !== "string") {
            winston.error("taskIdentifier must be a string, not " + taskIdentifier)
            const error = new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            return Promise.reject(error)
        }
        return this.sendTask(projectIdentifier, taskIdentifier)
    }
    isTaskImportant(projectIdentifier: any, taskIdentifier: any): Promise<boolean> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        if (typeof taskIdentifier !== "string") {
            winston.error("taskIdentifier must be a string, not " + taskIdentifier)
            const error = new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            return Promise.reject(error)
        }
        return this.dataProvider.isTaskImportant(projectIdentifier, taskIdentifier).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
    setTaskImportant(projectIdentifier: any, taskIdentifier: any, important: boolean): Promise<boolean> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        if (typeof taskIdentifier !== "string") {
            winston.error("taskIdentifier must be a string, not " + taskIdentifier)
            const error = new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            return Promise.reject(error)
        }
        return this.dataProvider.setTaskImportant(projectIdentifier, taskIdentifier, important).then(() => {
            return important
        }).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
    addModifier(projectIdentifier: any, taskIdentifier: any, modifier: any): Promise<ApiTaskResults> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        if (typeof taskIdentifier !== "string") {
            winston.error("taskIdentifier must be a string, not " + taskIdentifier)
            const error = new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            return Promise.reject(error)
        }
        const projectNode = maputils.get(this.graph.nodes, projectIdentifier)
        let taskNode = maputils.get(projectNode.nodes, taskIdentifier)
        return taskNode.addModifier(modifier).catch((error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        }).then(() => {
            return this.sendTask(projectIdentifier, taskIdentifier)
        })
    }
    import(project: any, tasks: any, taskRelations: any,
           delays: any, delayRelations: any): Promise<void> {
        return Promise.resolve().then(() => {
            const inputProject = createProject(project)
            if (!(tasks instanceof Array)) {
                throw new InputError("tasks must be an array, not " + tasks)
            }
            const inputTasks = tasks.map((task) => {
                return createTask(task)
            })
            if (!(taskRelations instanceof Array)) {
                throw new InputError("taskRelations must be an array, not " + taskRelations)
            }
            const inputTaskRelations = taskRelations.map((relation) => {
                return createTaskRelation(relation)
            })
            if (!(delays instanceof Array)) {
                throw new InputError("delays must be an array, not " + delays)
            }
            const inputDelays = delays.map((delays) => {
                return createDelay(delays)
            })
            if (!(delayRelations instanceof Array)) {
                throw new InputError("delayRelations must be an array, not " + delayRelations)
            }
            const inputDelayRelations = delayRelations.map((relation) => {
                return createDelayRelation(relation)
            })

            findCyclicDependency(inputTasks, inputTaskRelations)

            return this.graph.addProject(project).then((projectNode: IProjectNode) => {
                return Promise.all(inputTasks.map((task: TaskDefinition) => {
                    return projectNode.addTask(task)
                })).then(() => {
                    return Promise.all(inputTaskRelations.map((relation: TaskRelation) => {
                        return projectNode.addTaskRelation(relation)
                    }))
                }).then(() => {
                    return Promise.all(inputDelays.map((delay: DelayDefinition) => {
                        return projectNode.addDelay(delay)
                    }))
                }).then(() => {
                    return Promise.all(inputDelayRelations.map((relation: DelayRelation) => {
                        return projectNode.addDelayRelation(relation)
                    }))
                })
            })
        }).catch((error: Error) => {
            if (error instanceof InputError || error instanceof ExistsError) {
                winston.debug(error.message)
                throw new RequestError(400, "Invalid input for import")
            } else if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Invalid input for import")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
    private static collectDelays(taskNode: ITaskNode, delays: Set<IDelayNode>) {
        taskNode.delays.forEach((delay: IDelayNode) => {
            delays.add(delay)
        })

        taskNode.children.forEach((child: ITaskNode) => {
            Api.collectDelays(child, delays)
        })
    }
    private sendTask(projectIdentifier: string, taskIdentifier: string): Promise<ApiTaskResults> {
        return this.dataProvider.getTask(projectIdentifier, taskIdentifier).then((task: TaskDefinition) => {
            return this.dataProvider.getProject(projectIdentifier).then((project: Project) => {
                const projectNode = maputils.get(this.graph.nodes, projectIdentifier)
                let taskNode = maputils.get(projectNode.nodes, taskIdentifier)
                let delays = new Set<IDelayNode>()
                Api.collectDelays(taskNode, delays)

                return Promise.all(Array.from(delays, (node: IDelayNode) => {
                    return this.dataProvider.getDelay(projectIdentifier, node.delayIdentifier)
                })).then((delays: Array<DelayDefinition>) => {
                    const apiDelays = delays.map((delay: DelayDefinition) => {
                        const node = maputils.get(projectNode.delays, delay.identifier)
                        return createApiDelay(delay, node.initialMargin, node.margin)
                    })
                    const returned: ApiTaskResults = {
                        project: project,
                        task: createApiTask(task, taskNode.startDate, taskNode.duration),
                        modifiers: taskNode.modifiers,
                        delays: apiDelays
                    }
                    return returned
                })
            })
        }).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            } else if (isApiKnownError(error)) {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            } else {
                throw error
            }
        })
    }
}
