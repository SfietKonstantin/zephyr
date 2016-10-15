import { ITaskNode, IProjectNode, IGraph } from "../../server/core/graph/types"
import { Project, Task, TaskResults, TaskRelation, Modifier, Delay } from "../../common/types"

export class FakeTaskNode implements ITaskNode {
    projectIdentifier: string
    taskIdentifier: string
    startDate: Date
    duration: number
    children: Array<ITaskNode>
    parents: Array<ITaskNode>
    modifiers: Array<Modifier>
    constructor(startDate: Date, duration: number) {
        this.projectIdentifier = ""
        this.taskIdentifier = ""
        this.startDate = startDate
        this.duration = duration
        this.children = new Array<ITaskNode>()
        this.parents = new Array<ITaskNode>()
        this.modifiers = new Array<Modifier>()
    }
    addModifier(modifier: Modifier): Promise<Modifier> {
        return Promise.reject(new Error("Not mocked"))
    }
}

export class FakeProjectNode implements IProjectNode {
    projectIdentifier: string
    nodes: Map<string, ITaskNode>
    constructor() {
        this.projectIdentifier = ""
        this.nodes = new Map<string, ITaskNode>()
    }
    addTask(task: Task): Promise<ITaskNode> {
        return Promise.reject(new Error("Not mocked"))
    }
    addRelation(relation: TaskRelation): Promise<void> {
        return Promise.reject(new Error("Not mocked"))
    }
}

export class FakeGraph implements IGraph {
    nodes: Map<string, IProjectNode>
    constructor() {
        this.nodes = new Map<string, IProjectNode>()
    }
    addProject(project: Project): Promise<IProjectNode> {
        return Promise.reject(new Error("Not mocked"))
    }
}