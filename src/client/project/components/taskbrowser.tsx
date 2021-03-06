import * as React from "react"
import { Dispatch } from "redux"
import { State, TaskFilters } from "../types"
import { fetchTasks, filterTasks } from "../actions/tasks"
import { ListGroupItem } from "react-bootstrap"
import { TaskList, TaskListProperties } from "../../common/tasklist/components/tasklist"
import { TaskListFilters } from "../../common/tasklist/types"
import { assign } from "../../common/assign"
import { previousTasksPage, nextTasksPage } from "../../common/tasklist/actions"
import { TasksHeader } from "../components/tasksheader"
import { Task } from "../../../common/types"

interface TaskBrowserTaskListProperties extends TaskListProperties<Task, TaskFilters> {
    projectIdentifier: string
}

class TaskBrowserTaskList extends TaskList<Task, TaskFilters, TaskBrowserTaskListProperties> {
    constructor(props: TaskBrowserTaskListProperties) {
        super(props)
    }
    protected createElement(task: Task): JSX.Element {
        const taskLink = "/project/" + this.props.projectIdentifier + "/task/" + task.identifier
        const milestoneIndicator = TaskBrowserTaskList.createMilestoneIndicator(task)
        return <ListGroupItem href={taskLink} key={task.identifier}>
            <span className="common-task-indicator">{milestoneIndicator}</span>
            <span>{task.name} </span>
            <span className="text-muted">#{task.identifier}</span>
        </ListGroupItem>
    }
    private static createMilestoneIndicator(task: Task): JSX.Element | null {
        if (task.estimatedDuration !== 0) {
            return null
        }
        return <span className="glyphicon glyphicon-flag"></span>
    }
}

interface TaskBrowserProperties {
    projectIdentifier: string
    tasks: Array<Task>
    filters: TaskFilters
    currentPage: number
    maxPage: number
    onFiltersChanged: (projectIdentifier: string, filters: TaskFilters) => void
    onFetchTasks: (projectIdentifier: string, filters: TaskFilters) => void
    onPreviousTasksPage: () => void
    onNextTasksPage: () => void
}

export class TaskBrowser extends React.Component<TaskBrowserProperties, {}> {
    render() {
        const onFiltersChanged = this.props.onFiltersChanged.bind(this, this.props.projectIdentifier)
        return <TaskBrowserTaskList projectIdentifier={this.props.projectIdentifier} tasks={this.props.tasks}
                                    filters={this.props.filters} currentPage={this.props.currentPage}
                                    maxPage={this.props.maxPage}
                                    onFiltersChanged={onFiltersChanged}
                                    onPreviousPage={this.onPreviousPage.bind(this)}
                                    onNextPage={this.onNextPage.bind(this)} >
            <TasksHeader filters={this.props.filters} onFiltersChanged={onFiltersChanged} />
        </TaskBrowserTaskList>
    }
    componentDidMount() {
        this.props.onFetchTasks(this.props.projectIdentifier, this.props.filters)
    }
    private onPreviousPage() {
        this.props.onPreviousTasksPage()
    }
    private onNextPage() {
        this.props.onNextTasksPage()
    }
}

export const mapStateToProps = (state: State) => {
    return {
        projectIdentifier: state.projectIdentifier,
        tasks: state.tasks.taskList.displayedTasks,
        filters: state.tasks.taskList.filters,
        currentPage: state.tasks.taskList.currentPage,
        maxPage: state.tasks.taskList.maxPage
    }
}

export const mapDispatchToProps = (dispatch: Dispatch<State>) => {
    return {
        onFiltersChanged: (projectIdentifier: string, taskFilters: TaskFilters) => {
            dispatch(filterTasks(projectIdentifier, taskFilters))
        },
        onFetchTasks: (projectIdentifier: string, taskFilters: TaskFilters) => {
            dispatch(fetchTasks(projectIdentifier, taskFilters))
        },
        onPreviousTasksPage: () => {
            dispatch(previousTasksPage())
        },
        onNextTasksPage: () => {
            dispatch(nextTasksPage())
        }
    }
}
