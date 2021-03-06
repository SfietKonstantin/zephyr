import * as chai from "chai"
import { parseTasks, parseRelations, mapTasks, filterRelations } from "../../client/imports/primavera/imports"
import { InvalidFormatError } from "../../client/common/actions/files"
import { PrimaveraTask, PrimaveraTaskRelation } from "../../client/imports/primavera/types"
import * as maputils from "../../common/maputils"
import { ApiInputTask } from "../../common/apitypes"
import { TaskRelation, TaskLocation } from "../../common/types"
import { makeRelations } from "./primaverahelper"
import { expectMapEqual } from "./expectutils"

describe("Primavera import", () => {
    describe("Tasks", () => {
        it("Should throw an exception on input < 2 lines", () => {
            const tasks = "header"
            chai.expect(() => {parseTasks(tasks)}).to.throw(InvalidFormatError)
        })
        it("Should import a empty task listing", () => {
            const tasks = "header\nsecond_line"
            const results = parseTasks(tasks)
            chai.expect(results).to.length(0)
            chai.expect(results.tasks.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should ignore empty lines", () => {
            const tasks = "header\nsecond_line\n\n\n"
            const results = parseTasks(tasks)
            chai.expect(results).to.length(0)
            chai.expect(results.tasks.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should throw an exception on input < 9 column", () => {
            const tasks = "header\nsecond_line\ntest"
            chai.expect(() => {parseTasks(tasks)}).to.throw(InvalidFormatError)
        })
        it("Should import a simple task", () => {
            const tasks = "header\nsecond_line\nid\t\t\t\tTask\t25\t\t1/02/2016 12:34:56\t26/02/2016 12:34:56"
            const results = parseTasks(tasks)
            const expected: PrimaveraTask = {
                identifier: "id",
                name: "Task",
                startDate: new Date(2016, 1, 1),
                duration: 25
            }
            chai.expect(results).to.length(1)
            chai.expect(results.tasks.get("id")).to.deep.equal(expected)
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should not import a task without id", () => {
            const tasks = "header\nsecond_line\n\t\t\t\tTask\t25\t\t1/02/2016 12:34:56\t26/02/2016 12:34:56"
            const results = parseTasks(tasks)
            chai.expect(results).to.length(0)
            chai.expect(results.tasks.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should not import invalid task with invalid start date and end date", () => {
            const tasks = "header\nsecond_line\nid\t\t\t\tTask\t25\t\tabcde\tabcde"
            const results = parseTasks(tasks)
            chai.expect(results).to.length(1)
            chai.expect(results.tasks.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(1)
        })
        it("Should emit duplicated warnings", () => {
            const tasks = "header\nsecond_line\n" +
                        "id\t\t\t\tTask 1\t25\t\t1/02/2016 12:34:56\t26/02/2016 12:34:56\n" +
                        "id\t\t\t\tTask 2\t10\t\t10/02/2016 10:00:00\t20/02/2016 10:00:00"
            const results = parseTasks(tasks)
            const expected: PrimaveraTask = {
                identifier: "id",
                name: "Task 1",
                startDate: new Date(2016, 1, 1),
                duration: 25
            }
            chai.expect(results).to.length(2)
            chai.expect(results.tasks.get("id")).to.deep.equal(expected)
            chai.expect(results.warnings.size).to.equal(1)
        })
        it("Should parse start milestones", () => {
            const tasks = "header\nsecond_line\nid\t\t\t\tTask\t0\t\t1/02/2016 12:34:56\t"
            const results = parseTasks(tasks)
            const expected: PrimaveraTask = {
                identifier: "id",
                name: "Task",
                startDate: new Date(2016, 1, 1),
                duration: 0
            }
            chai.expect(results).to.length(1)
            chai.expect(results.tasks.get("id")).to.deep.equal(expected)
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should parse end milestones", () => {
            const tasks = "header\nsecond_line\nid\t\t\t\tTask\t0\t\t\t26/02/2016 12:34:56"
            const results = parseTasks(tasks)
            const expected: PrimaveraTask = {
                identifier: "id",
                name: "Task",
                startDate: new Date(2016, 1, 26),
                duration: 0
            }
            chai.expect(results).to.length(1)
            chai.expect(results.tasks.get("id")).to.deep.equal(expected)
            chai.expect(results.warnings.size).to.equal(0)
        })
    })
    describe("Relations", () => {
        it("Should throw an exception on input < 2 lines", () => {
            const relations = "header"
            chai.expect(() => {parseRelations(relations)}).to.throw(InvalidFormatError)
        })
        it("Should import a empty relations listing", () => {
            const relations = "header\nsecond_line"
            const results = parseRelations(relations)
            chai.expect(results).to.length(0)
            chai.expect(results.relations.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should ignore empty lines", () => {
            const relations = "header\nsecond_line\n\n\n"
            const results = parseRelations(relations)
            chai.expect(results).to.length(0)
            chai.expect(results.relations.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should throw an exception on input < 10 column", () => {
            const relations = "header\nsecond_line\ntest"
            chai.expect(() => {parseRelations(relations)}).to.throw(InvalidFormatError)
        })
        it("Should import various relations", () => {
            const relations = "header\nsecond_line\n"
                              + "task1\ttask2\tFS\t\t\t\t\t\t\t10\n"
                              + "task3\ttask4\tSS\t\t\t\t\t\t\t5\n"
                              + "task5\ttask6\tFF\t\t\t\t\t\t\t1"
            const results = parseRelations(relations)
            const expected: Array<PrimaveraTaskRelation> = [
                {
                    previous: "task1",
                    next: "task2",
                    type: "FS",
                    lag: 10
                },
                {
                    previous: "task3",
                    next: "task4",
                    type: "SS",
                    lag: 5
                },
                {
                    previous: "task5",
                    next: "task6",
                    type: "FF",
                    lag: 3
                }
            ]
            chai.expect(results).to.length(3)
            expectMapEqual(results.relations, makeRelations(expected))
            chai.expect(results.warnings.size).to.equal(0)
        })
        it("Should import SF relation", () => {
            const relations = "header\nsecond_line\ntask1\ttask2\tSF\t\t\t\t\t\t\t1"
            const results = parseRelations(relations)
            const expected: Array<PrimaveraTaskRelation> = [
                {
                    previous: "task2",
                    next: "task1",
                    type: "FS",
                    lag: -1
                }
            ]
            chai.expect(results).to.length(1)
            expectMapEqual(results.relations, makeRelations(expected))
            chai.expect(results.warnings.size).to.equal(1)
        })
        it("Should not import invalid lag relation", () => {
            const relations = "header\nsecond_line\ntask1\ttask2\tFS\t\t\t\t\t\t\tabcde"
            const results = parseRelations(relations)
            chai.expect(results).to.length(1)
            chai.expect(results.relations.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(1)
        })
        it("Should not import invalid type relation", () => {
            const relations = "header\nsecond_line\ntask1\ttask2\tabcde\t\t\t\t\t\t\t10"
            const results = parseRelations(relations)
            chai.expect(results).to.length(1)
            chai.expect(results.relations.size).to.equal(0)
            chai.expect(results.warnings.size).to.equal(1)
        })
        it("Should not import duplicated relation", () => {
            const relations = "header\nsecond_line\n"
                              + "task1\ttask2\tFS\t\t\t\t\t\t\t10\n"
                              + "task1\ttask3\tFS\t\t\t\t\t\t\t5\n"
                              + "task1\ttask2\tFS\t\t\t\t\t\t\t1"
            const results = parseRelations(relations)
            const expected: Array<PrimaveraTaskRelation> = [
                {
                    previous: "task1",
                    next: "task2",
                    type: "FS",
                    lag: 10
                },
                {
                    previous: "task1",
                    next: "task3",
                    type: "FS",
                    lag: 5
                }
            ]
            chai.expect(results).to.length(3)
            expectMapEqual(results.relations, makeRelations(expected))
            chai.expect(results.warnings.size).to.equal(1)
        })
    })
    describe("Map tasks", () => {
        it("Should map tasks", () => {
            const input: Map<string, PrimaveraTask> = new Map<string, PrimaveraTask>()
            input.set("task1", {
                identifier: "task1",
                name: "Task 1",
                startDate: new Date(2016, 9, 1),
                duration: 15
            })
            input.set("task2", {
                identifier: "task2",
                name: "Task 2",
                startDate: new Date(2016, 9, 1),
                duration: 0
            })
            const expected: Array<ApiInputTask> = [
                {
                    identifier: "task1",
                    name: "Task 1",
                    description: "",
                    estimatedStartDate: new Date(2016, 9, 1).toISOString(),
                    estimatedDuration: 15
                },
                {
                    identifier: "task2",
                    name: "Task 2",
                    description: "",
                    estimatedStartDate: new Date(2016, 9, 1).toISOString(),
                    estimatedDuration: 0
                }
            ]
            chai.expect(mapTasks(input, new Set<string>())).to.deep.equal(expected)
        })
    })
    describe("Filter relations", () => {
        it("Should filter invalid task relations", () => {
            const tasks: Map<string, PrimaveraTask> = new Map<string, PrimaveraTask>()
            tasks.set("task1", {
                identifier: "task1",
                name: "Task 1",
                startDate: new Date(2016, 9, 1),
                duration: 15
            })
            tasks.set("task2", {
                identifier: "task2",
                name: "Task 2",
                startDate: new Date(2016, 9, 1),
                duration: 15
            })
            tasks.set("task3", {
                identifier: "task3",
                name: "Task 3",
                startDate: new Date(2016, 9, 1),
                duration: 15
            })
            tasks.set("task4", {
                identifier: "task4",
                name: "Task 4",
                startDate: new Date(2016, 9, 1),
                duration: 15
            })
            const relations: Array<PrimaveraTaskRelation> = [
                {
                    previous: "task1",
                    next: "task2",
                    type: "FS",
                    lag: 3
                },
                {
                    previous: "task1",
                    next: "task3",
                    type: "SS",
                    lag: 5
                },
                {
                    previous: "task1",
                    next: "task5",
                    type: "FS",
                    lag: 0
                },
                {
                    previous: "task5",
                    next: "task4",
                    type: "FS",
                    lag: 0
                },
                {
                    previous: "task1",
                    next: "task4",
                    type: "FF",
                    lag: 0
                }
            ]
            const expected: Array<TaskRelation> = [
                {
                    previous: "task1",
                    previousLocation: TaskLocation.End,
                    next: "task2",
                    lag: 3
                },
                {
                    previous: "task1",
                    previousLocation: TaskLocation.Beginning,
                    next: "task3",
                    lag: 5
                }
            ]
            const results = filterRelations(tasks, new Set<string>(), makeRelations(relations))
            chai.expect(results.taskRelations).to.deep.equal(expected)
            chai.expect(results.warnings.size).to.equal(3)
        })
    })
})
