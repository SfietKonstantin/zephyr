import * as winston from "winston"
import { Project, Task, TaskResults, Modifier } from "../../common/types"
import { IDataProvider, CorruptedError } from "../core/data/idataprovider"
import { IGraph, IProjectNode, ITaskNode, GraphError } from "../core/graph/types"
import { findCyclicDependency } from "../core/graph/analyzer"
import { ApiTask, ApiProjectTaskModifiers, createProject, createTask, createApiTask } from "../../common/apitypes"
import { NotFoundError, ExistsError, InputError } from "../../common/errors"
import * as maputils from "../../common/maputils"

interface ErrorJson {
    error: string
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
            throw new RequestError(500, "Internal error")
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
            } else {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            }
        })
    }
    getProjectTasks(projectIdentifier: any): Promise<Array<ApiTask>> {
        if (typeof projectIdentifier !== "string") {
            winston.error("projectIdentifier must be a string, not " + projectIdentifier)
            const error = new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            return Promise.reject(error)
        }
        return this.dataProvider.getProjectTasks(projectIdentifier).then((tasks: Array<Task>) => {
            tasks = tasks.filter((value: Task) => { return !!value })
            const projectNode = maputils.get(this.graph.nodes, projectIdentifier)
            const returned: Array<ApiTask> = tasks.map((task: Task) => {
                let taskNode = maputils.get(projectNode.nodes, task.identifier)
                return createApiTask(task, taskNode.startDate, taskNode.duration)
            })
            return returned
        }).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Project \"" + projectIdentifier + "\" not found")
            } else {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            }
        })
    }
    getTask(projectIdentifier: any, taskIdentifier: any): Promise<ApiProjectTaskModifiers> {
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
            } else {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
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
            } else {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            }
        })
    }
    addModifier(modifier: any, taskIdentifier: any): Promise<ApiProjectTaskModifiers> {
        const projectNode = maputils.get(this.graph.nodes, modifier.projectIdentifier)
        let taskNode = maputils.get(projectNode.nodes, taskIdentifier)
        return taskNode.addModifier(modifier).then(() => {
            return this.getTask(modifier.projectIdentifier, taskIdentifier)
        }).catch((error: Error) => {
            if (error instanceof InputError) {
                winston.debug(error.message)
                throw new RequestError(400, "Invalid input for modifier")
            } else {
                throw error // Simply forward from getTask
            }
        })
    }
    import(project: any, tasks: any): Promise<void> {
        return Promise.resolve().then(() => {
            const inputProject = createProject(project)
            if (!(tasks instanceof Array)) {
                throw new InputError("tasks must be an array, not " + tasks)
            }
            const inputTasks = tasks.map((task) => {
                return createTask(task, inputProject.identifier)
            })

            // findCyclicDependency(inputTasks)

            return this.graph.addProject(project).then((projectNode: IProjectNode) => {
                return Promise.all(inputTasks.map((task: Task) => {
                    return projectNode.addTask(task)
                }))
            })
        }).catch((error: Error) => {
            if (error instanceof InputError || error instanceof ExistsError) {
                winston.debug(error.message)
                throw new RequestError(400, "Invalid input for import")
            } else if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Invalid input for import")
            } else {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            }
        })
    }
    private sendTask(projectIdentifier: string, taskIdentifier: string): Promise<ApiProjectTaskModifiers> {
        return this.dataProvider.getTask(projectIdentifier, taskIdentifier).then((task: Task) => {
            return this.dataProvider.getProject(task.projectIdentifier).then((project: Project) => {
                const projectNode = maputils.get(this.graph.nodes, projectIdentifier)
                let taskNode = maputils.get(projectNode.nodes, taskIdentifier)

                const returned: ApiProjectTaskModifiers = {
                    project: project,
                    task: createApiTask(task, taskNode.startDate, taskNode.duration),
                    modifiers: taskNode.modifiers
                }
                return returned
            })
        }).catch((error: Error) => {
            if (error instanceof NotFoundError) {
                winston.debug(error.message)
                throw new RequestError(404, "Task \"" + taskIdentifier + "\" not found")
            } else {
                winston.error(error.message)
                throw new RequestError(500, "Internal error")
            }
        })
    }
}