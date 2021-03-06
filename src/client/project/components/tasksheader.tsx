import * as React from "react"
import { ButtonGroup, Button } from "react-bootstrap"
import { TaskFilters } from "../types"
import { assign } from "../../common/assign"

interface TasksHeaderProperties {
    filters: TaskFilters
    onFiltersChanged: (filters: TaskFilters) => void
}

export class TasksHeader extends React.Component<TasksHeaderProperties, {}> {
    render() {
        const notStartedChecked = TasksHeader.getButtonStyle(this.props.filters.notStartedChecked)
        const inProgressChecked = TasksHeader.getButtonStyle(this.props.filters.inProgressChecked)
        const doneChecked = TasksHeader.getButtonStyle(this.props.filters.doneChecked)
        return <ButtonGroup>
            <Button bsStyle={notStartedChecked} onClick={this.handleNotStartedClicked.bind(this)}>
                <span className="glyphicon glyphicon-time" aria-hidden="true"></span>
                <span className="visible-md-inline visible-lg-inline"> Not started</span>
            </Button>
            <Button bsStyle={inProgressChecked} onClick={this.handleInProgress.bind(this)}>
                <span className="glyphicon glyphicon-plane" aria-hidden="true"></span>
                <span className="visible-md-inline visible-lg-inline"> In progress</span>
            </Button>
            <Button bsStyle={doneChecked} onClick={this.handleDoneClicked.bind(this)}>
                <span className="glyphicon glyphicon-ok" aria-hidden="true"></span>
                <span className="visible-md-inline visible-lg-inline"> Done</span>
            </Button>
        </ButtonGroup>
    }
    private static getButtonStyle(checked: boolean): string {
        return checked ? "primary" : "default"
    }
    private handleNotStartedClicked(e: React.MouseEvent) {
        const notStartedChecked = !this.props.filters.notStartedChecked
        this.props.onFiltersChanged(assign(this.props.filters, {notStartedChecked}))
    }
    private handleInProgress(e: React.MouseEvent) {
        const inProgressChecked = !this.props.filters.inProgressChecked
        this.props.onFiltersChanged(assign(this.props.filters, {inProgressChecked}))
    }
    private handleDoneClicked(e: React.MouseEvent) {
        const doneChecked = !this.props.filters.doneChecked
        this.props.onFiltersChanged(assign(this.props.filters, {doneChecked}))
    }
}

