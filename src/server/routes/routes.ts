import * as express from "express"
import { IDataProvider } from "../core/data/idataprovider"

export class Routes {
    private dataProvider: IDataProvider
    constructor(dataProvider: IDataProvider) {
        this.dataProvider = dataProvider
    }
    index(req: express.Request, res: express.Response) {
        res.render("index")
    }
    getProject(req: express.Request, res: express.Response) {
        const projectIdentifier = String(req.params.projectIdentifier)
        res.render("project", {projectIdentifier})
    }
    getTask(req: express.Request, res: express.Response) {
        const projectIdentifier = String(req.params.projectIdentifier)
        const taskIdentifier = String(req.params.taskIdentifier)
        res.render("task", {projectIdentifier, taskIdentifier})
    }
    getImport(req: express.Request, res: express.Response) {
        const source = String(req.params.source)
        if (source === "primavera") {
            res.render("import", {source: source})
        } else {
            res.status(404).render("error", {})
        }
    }
}
