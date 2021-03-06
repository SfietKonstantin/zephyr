import * as React from "react"
import { Project, TaskDefinition } from "../../../common/types"

interface BreadcrumbProperties {
    project: Project
    task: TaskDefinition
}

export class Breadcrumb extends React.Component<BreadcrumbProperties, {}> {
    render() {
        const name = this.renderName()
        const projectPath = "/project/" + this.props.project.identifier
        return <ol className="breadcrumb">
            <li><a href="/"><span className="glyphicon glyphicon-home" aria-hidden="true"></span></a></li>
            <li><a href={projectPath}>{this.props.project.name}</a></li>
            <li className="active">{name}</li>
        </ol>
    }
    private renderName() {
        const name = this.props.task.name
        if (name.length < 50) {
            return name
        } else {
            return name.slice(0, 50) + " ..."
        }
    }
}
