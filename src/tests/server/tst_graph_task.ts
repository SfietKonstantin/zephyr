import * as chai from "chai"
import * as sinon from "sinon"
import { Project, Modifier, TaskLocation, DelayRelation } from "../../common/types"
import { FakeDataProvider } from "./fakedataprovider"
import { FakeGraph, FakeProjectNode } from "./fakegraph"
import { GraphError } from "../../server/core/graph/types"
import { Graph, ProjectNode, TaskNode, DelayNode } from "../../server/core/graph/graph"
import * as maputils from "../../common/maputils"

describe("Graph", () => {
    describe("TaskNode", () => {
        it("Should not compute when not needed", (done) => {
            const dataProvider = new FakeDataProvider()
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")
            const node = new TaskNode(dataProvider, projectNode, "task", new Date(2015, 2, 1), 20)

            node.compute().then(() => {
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should get error on invalid input", (done) => {
            const dataProvider = new FakeDataProvider()
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")
            const node = new TaskNode(dataProvider, projectNode, "task", new Date(NaN), 20)
            node.compute().then(() => {
                done(new Error("Input error should be detected"))
            }).catch((error) => {
                chai.expect(error).to.instanceOf(GraphError)
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should compute the correct results based on modifiers 1", (done) => {
            // Mock
            const dataProvider = new FakeDataProvider()
            let mock = sinon.mock(dataProvider)
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")

            // Test
            const node = new TaskNode(dataProvider, projectNode, "task", new Date(2015, 2, 1), 20)
            const delayNode = new DelayNode(dataProvider, projectNode, "delay", new Date(2015, 3, 10))
            const relation: DelayRelation = {
                delay: "delay",
                task: "task",
                lag: 0
            }
            node.addDelay(delayNode, relation)
            chai.expect(delayNode.initialMargin).to.equal(20)
            chai.expect(delayNode.margin).to.equal(20)

            node.modifiers = [
                {
                    name: "Modifier 1",
                    description: "Description 1",
                    duration: 5,
                    location: TaskLocation.End
                },
                {
                    name: "Modifier 2",
                    description: "Description 2",
                    duration: -2,
                    location: TaskLocation.End
                }
            ]

            node.compute().then(() => {
                chai.expect(delayNode.initialMargin).to.equal(20)
                chai.expect(delayNode.margin).to.equal(17)
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should compute the correct results based on modifiers 2", (done) => {
            // Mock
            const dataProvider = new FakeDataProvider()
            let mock = sinon.mock(dataProvider)
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")

            // Test
            const node = new TaskNode(dataProvider, projectNode, "task", new Date(2015, 2, 1), 20)
            const delayNode = new DelayNode(dataProvider, projectNode, "delay", new Date(2015, 3, 10))
            const relation: DelayRelation = {
                delay: "delay",
                task: "task",
                lag: 0
            }
            node.addDelay(delayNode, relation)
            chai.expect(delayNode.initialMargin).to.equal(20)
            chai.expect(delayNode.margin).to.equal(20)

            node.modifiers = [
                {
                    name: "Modifier 1",
                    description: "Description 1",
                    duration: 5,
                    location: TaskLocation.Beginning
                },
                {
                    name: "Modifier 2",
                    description: "Description 2",
                    duration: -2,
                    location: TaskLocation.Beginning
                }
            ]

            node.compute().then(() => {
                chai.expect(delayNode.initialMargin).to.equal(20)
                chai.expect(delayNode.margin).to.equal(17)
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should compute children when adding", (done) => {
            // Mock
            const dataProvider = new FakeDataProvider()
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")
            let mock = sinon.mock(dataProvider)

            // Test
            const node1 = new TaskNode(dataProvider, projectNode, "task1", new Date(2015, 2, 1), 20)
            const node2 = new TaskNode(dataProvider, projectNode, "task2", new Date(2015, 1, 1), 15)

            node1.addChild(node2, {
                previous: "task1",
                previousLocation: TaskLocation.End,
                next: "task2",
                lag: 0
            }).then(() => {
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should recompute when adding modifiers", (done) => {
            // Mock
            const dataProvider = new FakeDataProvider()
            let mock = sinon.mock(dataProvider)
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")

            const modifier: Modifier = {
                name: "Modifier 1",
                description: "Description 1",
                duration: 2,
                location: TaskLocation.End
            }
            mock.expects("addModifier").once().withExactArgs("project", modifier).returns(Promise.resolve(1))
            mock.expects("addModifierForTask").once().withExactArgs("project", 1, "task1")
                .returns(Promise.resolve())

            // Test
            const node1 = new TaskNode(dataProvider, projectNode, "task1", new Date(2015, 2, 1), 20)
            const node2 = new TaskNode(dataProvider, projectNode, "task2", new Date(2015, 1, 1), 15)

            node1.addChild(node2, {
                previous: "task1",
                previousLocation: TaskLocation.End,
                next: "task2",
                lag: 0
            }).then(() => {
                return node1.addModifier(modifier)
            }).then(() => {
                chai.expect(node1.startDate).to.deep.equal(new Date(2015, 2, 1))
                chai.expect(node1.duration).to.equal(22)
                chai.expect(node2.startDate).to.deep.equal(new Date(2015, 2, 23))
                chai.expect(node2.duration).to.equal(15)
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should correctly compute milestones", (done) => {
            // Mock
            const dataProvider = new FakeDataProvider()
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")
            let mock = sinon.mock(dataProvider)
            const modifier: Modifier = {
                name: "Modifier 1",
                description: "Description 1",
                duration: 2,
                location: TaskLocation.End
            }
            mock.expects("addModifier").once().withExactArgs("project", modifier).returns(Promise.resolve(1))
            mock.expects("addModifierForTask").once().withExactArgs("project", 1, "task1")
                .returns(Promise.resolve())

            // Test
            const node1 = new TaskNode(dataProvider, projectNode, "task1", new Date(2015, 2, 1), 0)

            node1.addModifier(modifier).then(() => {
                chai.expect(node1.startDate).to.deep.equal(new Date(2015, 2, 3))
                chai.expect(node1.duration).to.equal(0)
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should detect cyclic dependencies", (done) => {
            // Mock
            const dataProvider = new FakeDataProvider()
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")
            let mock = sinon.mock(dataProvider)

            // Test
            const node1 = new TaskNode(dataProvider, projectNode, "task1", new Date(2015, 2, 1), 20)
            const node2 = new TaskNode(dataProvider, projectNode, "task2", new Date(2015, 1, 1), 15)

            node1.addChild(node2, {
                previous: "task1",
                previousLocation: TaskLocation.End,
                next: "task2",
                lag: 0
            }).then(() => {
                return node2.addChild(node1, {
                    previous: "task2",
                    previousLocation: TaskLocation.End,
                    next: "task1",
                    lag: 0
                })
            }).then(() => {
                done(new Error("Cyclic dependency should be detected"))
            }).catch((error) => {
                chai.expect(error).to.instanceOf(GraphError)
                done()
            }).catch((error) => {
                done(error)
            })
        })
        it("Should not detect diamonds", (done) => {
            // Mock
            const dataProvider = new FakeDataProvider()
            const graph = new FakeGraph()
            const projectNode = new FakeProjectNode(graph, "project")
            let mock = sinon.mock(dataProvider)

            // Test
            const node1 = new TaskNode(dataProvider, projectNode, "task1", new Date(2015, 2, 1), 0)
            const node2 = new TaskNode(dataProvider, projectNode, "task2", new Date(2015, 2, 1), 0)
            const node3 = new TaskNode(dataProvider, projectNode, "task3", new Date(2015, 2, 1), 0)
            const node4 = new TaskNode(dataProvider, projectNode, "task4", new Date(2015, 2, 1), 0)

            node1.addChild(node2, {
                previous: "task1",
                previousLocation: TaskLocation.End,
                next: "task2",
                lag: 0
            }).then(() => {
                return node1.addChild(node3, {
                    previous: "task1",
                    previousLocation: TaskLocation.End,
                    next: "task3",
                    lag: 0
                })
            }).then(() => {
                return node2.addChild(node4, {
                    previous: "task2",
                    previousLocation: TaskLocation.End,
                    next: "task4",
                    lag: 0
                })
            }).then(() => {
                return node3.addChild(node4, {
                    previous: "task3",
                    previousLocation: TaskLocation.End,
                    next: "task4",
                    lag: 0
                })
            }).then(() => {
                done()
            }).catch((error) => {
                done(error)
            })
        })
    })
})
