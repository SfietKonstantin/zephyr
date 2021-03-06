import { Project, TaskDefinition, TaskRelation, Modifier, DelayDefinition, DelayRelation } from "../../../common/types"

export class GraphError extends Error implements Error {
    constructor(message: string) {
        super(message)
    }
}

export interface ITaskNode {
    parent: IProjectNode
    taskIdentifier: string
    startDate: Date
    duration: number
    children: Array<ITaskNode>
    parents: Array<ITaskNode>
    delays: Array<IDelayNode>
    modifiers: Array<Modifier>
    addModifier(modifier: Modifier): Promise<Modifier>
}

export interface IDelayNode {
    parent: IProjectNode
    delayIdentifier: string
    initialMargin: number
    margin: number
    tasks: Array<ITaskNode>
}

export interface IProjectNode {
    parent: IGraph
    projectIdentifier: string
    nodes: Map<string, ITaskNode>
    delays: Map<string, IDelayNode>
    addTask(task: TaskDefinition): Promise<ITaskNode>
    addDelay(delay: DelayDefinition): Promise<IDelayNode>
    addTaskRelation(relation: TaskRelation): Promise<void>
    addDelayRelation(relation: DelayRelation): Promise<void>
}

export interface IGraph {
    nodes: Map<string, IProjectNode>
    addProject(project: Project): Promise<IProjectNode>
}
