import * as latinize from "latinize"
import { Task, TaskListFilters, MilestoneFilterMode } from "./types"

export const filterTaskList = <T extends Task>(tasks: Array<T>, filters: TaskListFilters): Array<T> => {
    return tasks.filter((task: T) => {
        switch (filters.milestoneFilterMode) {
            case MilestoneFilterMode.TasksOnly:
                if (task.duration === 0) {
                    return false
                }
                break
            case MilestoneFilterMode.MilestonesOnly:
                if (task.duration !== 0) {
                    return false
                }
                break
            default:
                break
        }
        if (filters.text.length > 0) {
            const lowerFilter = latinize(filters.text.trim()).toLowerCase()
            const lowerIdentifier = latinize(task.identifier.trim()).toLowerCase()
            const lowerName = latinize(task.name.trim()).toLowerCase()
            if (lowerIdentifier.indexOf(lowerFilter) === -1 && lowerName.indexOf(lowerFilter) === -1) {
                return false
            }
        }

        return true
    })
}
