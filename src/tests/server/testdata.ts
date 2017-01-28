import {Project} from "../../common/project"
import {TaskDefinition} from "../../common/task"
import {TaskLocation} from "../../common/tasklocation"
import {TaskRelation} from "../../common/taskrelation"

export const project: Project = {
    identifier: "project",
    name: "Project",
    description: "Project description"
}

export const project1: Project = {
    identifier: "project1",
    name: "Project 1",
    description: "Project description 1"
}

export const project2: Project = {
    identifier: "project2",
    name: "Project 2",
    description: "Project description 2"
}

export const project3: Project = {
    identifier: "project3",
    name: "Project 3",
    description: "Project description 3"
}

export const invalidProject: Project = {
    identifier: "invalidProject",
    name: "Invalid project",
    description: "Invalid project description"
}

export const taskd1: TaskDefinition = {
    identifier: "task1",
    name: "Task 1",
    description: "Task description 1",
    estimatedStartDate: new Date(2016, 9, 1),
    estimatedDuration: 30
}
export const taskd2: TaskDefinition = {
    identifier: "task2",
    name: "Task 2",
    description: "Task description 2",
    estimatedStartDate: new Date(2016, 9, 15),
    estimatedDuration: 15
}

export const taskd3: TaskDefinition = {
    identifier: "task3",
    name: "Task 3",
    description: "Task description 3",
    estimatedStartDate: new Date(2016, 10, 1),
    estimatedDuration: 10
}

export const taskd4: TaskDefinition = {
    identifier: "task4",
    name: "Task 4",
    description: "Task description 4",
    estimatedStartDate: new Date(2016, 10, 10),
    estimatedDuration: 5
}

export const invalidTaskd: TaskDefinition = {
    identifier: "invalidTaskd",
    name: "Invalid task",
    description: "Invalid task description",
    estimatedStartDate: new Date(2000, 0, 1),
    estimatedDuration: 0
}

export const taskRelation1: TaskRelation = {
    previous: taskd1.identifier,
    previousLocation: TaskLocation.End,
    next: taskd2.identifier,
    lag: 12
}

export const taskRelation2: TaskRelation = {
    previous: taskd1.identifier,
    previousLocation: TaskLocation.End,
    next: taskd3.identifier,
    lag: 34
}

export const invalidTaskRelation1: TaskRelation = {
    previous: invalidTaskd.identifier,
    previousLocation: TaskLocation.End,
    next: taskd1.identifier,
    lag: 0
}

export const invalidTaskRelation2: TaskRelation = {
    previous: taskd1.identifier,
    previousLocation: TaskLocation.End,
    next: invalidTaskd.identifier,
    lag: 0
}
