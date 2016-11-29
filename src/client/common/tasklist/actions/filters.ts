import { Action, Dispatch } from "redux"
import { State, Task, TaskListFilters } from "../types"

export const TASKS_UPDATE = "TASKS_UPDATE"
export const FILTERS_UPDATE = "FILTERS_UPDATE"

export interface TasksAction<T extends Task> extends Action {
    type: string,
    tasks: Array<T>
}

export interface FiltersAction<T extends Task, F extends TaskListFilters> extends Action {
    type: string,
    tasks: Array<T>
    filters: F
}

export const updateTasks = <T extends Task>(tasks: Array<T>): TasksAction<T> => {
    return {
        type: TASKS_UPDATE,
        tasks
    }
}

export const updateFilters = <T extends Task,
                              F extends TaskListFilters
                             >(tasks: Array<T>, filters: F): FiltersAction<T, F> => {
    return {
        type: FILTERS_UPDATE,
        tasks,
        filters
    }
}
