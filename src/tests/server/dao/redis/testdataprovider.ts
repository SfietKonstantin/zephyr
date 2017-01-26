import * as redis from "redis"
import * as bluebird from "bluebird"
import {project1, project2, taskd1, taskd2} from "../../testdata"
import {Project} from "../../../../common/project"
import {TaskDefinition} from "../../../../common/task"
import {KeyFactory} from "../../../../server/dao/redis/utils/keyfactory"
bluebird.promisifyAll(redis)

export interface RedisAsyncClient extends redis.RedisClient {
    setAsync(...args: any[]): Promise<any>
    delAsync(...args: any[]): Promise<any>
    msetAsync(...args: any[]): Promise<any>
    hmsetAsync(...args: any[]): Promise<any>
    hdelAsync(...args: any[]): Promise<any>
    saddAsync(...args: any[]): Promise<any>
}

export class RedisTestDataProvider {
    static dump(): Promise<redis.RedisClient> {
        let client = RedisTestDataProvider.getClient()
        RedisTestDataProvider.flush(client)

        return Promise.resolve().then(() => {
            // Add some projects
            return Promise.all([project1, project2].map((project: Project) => {
                const projectIdsKey = KeyFactory.createGlobalProjectKey("ids")
                return client.saddAsync(projectIdsKey, project.identifier).then(() => {
                    const redisProject = {
                        name: project.name,
                        description: project.description
                    }
                    const projectKey = KeyFactory.createProjectKey(project.identifier)
                    return client.hmsetAsync(projectKey, redisProject)
                })
            }))
        }).then(() => {
            return Promise.all([taskd1, taskd2].map((task: TaskDefinition) => {
                const projectTasksKey = KeyFactory.createProjectKey(project1.identifier, "tasks")
                return client.saddAsync(projectTasksKey, task.identifier).then(() => {
                    const redisTask = {
                        name: task.name,
                        description: task.description,
                    }
                    const taskKey = KeyFactory.createTaskKey(project1.identifier, task.identifier)
                    return client.hmsetAsync(taskKey, redisTask)
                }).then(() => {
                    const startDateKey = `task:${project1.identifier}:${task.identifier}:estimatedStartDate`
                    const durationKey = `task:${project1.identifier}:${task.identifier}:estimatedDuration`
                    return client.msetAsync(startDateKey, task.estimatedStartDate.getTime(),
                        durationKey, task.estimatedDuration)
                })
            }))
        }).then(() => {
            return client
        })
    }

    static deleteValue(client: redis.RedisClient, key: string): Promise<void> {
        return (client as RedisAsyncClient).delAsync(key)
    }

    static deleteMember(client: redis.RedisClient, key: string, member: string): Promise<void> {
        return (client as RedisAsyncClient).hdelAsync(key, member)
    }

    static setValue(client: redis.RedisClient, key: string, value: string) {
        return (client as RedisAsyncClient).setAsync(key, value)
    }

    static addValue(client: redis.RedisClient, key: string, value: string) {
        return (client as RedisAsyncClient).saddAsync(key, value)
    }

    static flush(client: redis.RedisClient) {
        client.flushdb()
    }

    private static getClient(): RedisAsyncClient {
        let client = redis.createClient() as RedisAsyncClient
        client.select(3)
        return client
    }
}
