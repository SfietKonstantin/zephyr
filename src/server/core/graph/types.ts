export class TaskNode {
    identifier: string
    estimatedStartDate: Date
    estimatedDuration: number
    startDate: Date | null
    duration: number | null
    parents: Array<TaskNode>
    children: Array<TaskNode>
    modifiers: Array<number>

    constructor(identifier: string, estimatedStartDate: Date, estimatedDuration: number) {
        this.identifier = identifier
        this.estimatedStartDate = estimatedStartDate
        this.estimatedDuration = estimatedDuration
        this.startDate = null
        this.duration = null
        this.parents = new Array<TaskNode>()
        this.children = new Array<TaskNode>()
        this.modifiers = new Array<number>()
    }

    addChild(child: TaskNode) {
        this.children.push(child)
        child.parents.push(this)
    }
}