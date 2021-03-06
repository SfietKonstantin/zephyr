import * as React from "react"
import { Row, Col, Panel, ProgressBar, Label } from "react-bootstrap"
import { Task } from "../../../common/types"
import * as dateutils from "../../../common/dateutils"

interface StateIndicatorProperties {
    icon: string
    text: string
}

export class StatusStateIndicator extends React.Component<StateIndicatorProperties, {}> {
    render() {
        const className = "glyphicon glyphicon-" + this.props.icon
        return <div className="task-overview-state">
            <span className={className} aria-hidden="true"></span> {this.props.text}
        </div>
    }
}

interface StatusTimeProperties {
    className: string
    color: string
    state: string
    date: string
    todayDiff: string
}

export class StatusTime extends React.Component<StatusTimeProperties, {}> {
    render() {
        return <Col className={this.props.className} xs={12} sm={6}>
            <div className="task-overview-label">
                <Label bsStyle={this.props.color}>{this.props.state}</Label>
            </div>
            <div className="task-overview-time">{this.props.date}</div>
            <div>{this.props.todayDiff}</div>
        </Col>
    }
}

interface StatusProperties {
    task: Task
}

export class Status extends React.Component<StatusProperties, {}> {
    render() {
        const daysBeforeStart = this.getDaysBeforeStart()
        const daysBeforeEnd = this.getDaysBeforeEnd()
        const started = daysBeforeStart < 0
        const done = daysBeforeEnd < 0
        const endDate = this.getEndDate()

        const milestone = this.props.task.estimatedDuration === 0
        const stateInfo = this.getStateInfo(started, done)
        const progressInfo = this.getProgressInfo(started, done)
        const startState = this.getStartState()
        const startDateLabel = this.getStartDateLabel(started, milestone)
        const startTodayDiff = this.getStartTodayDiff()

        let endStatusTime: JSX.Element | null = null
        if (!milestone) {
            const endState = this.getEndState(endDate)
            const endDateLabel = this.getEndDateLabel(done, endDate)
            const endTodayDiff = this.getEndTodayDiff(endDate)

            endStatusTime = <StatusTime className="task-overview-end" color={endState[0]} state={endState[1]}
                                    date={endDateLabel} todayDiff={endTodayDiff} />
        }

        return <Panel className="task-overview">
            <StatusStateIndicator icon={stateInfo[0]} text={stateInfo[1]} />
            <ProgressBar className="task-overview-progress" now={progressInfo} />
            <Row>
                <StatusTime className="task-overview-start" color={startState[0]} state={startState[1]}
                            date={startDateLabel} todayDiff={startTodayDiff} />
                {endStatusTime}
            </Row>
        </Panel>
    }
    private getDaysBeforeStart() {
        return dateutils.getDateDiff(new Date(), this.props.task.startDate)
    }
    private getEndDate() {
        let returned = new Date(this.props.task.startDate.getTime())
        returned.setDate(returned.getDate() + this.props.task.duration)
        return returned
    }
    private getEstimatedEndDate() {
        let returned = new Date(this.props.task.estimatedStartDate.getTime())
        returned.setDate(returned.getDate() + this.props.task.estimatedDuration)
        return returned
    }
    private getDaysBeforeEnd() {
        return dateutils.getDateDiff(new Date(), this.getEndDate())
    }
    private getStateInfo(started: boolean, done: boolean): [string, string] {
        if (!started) {
            return ["time", "Not started"]
        } else if (started && !done) {
            return ["plane", "In progress"]
        } else if (done) {
            return ["ok", "Done"]
        } else {
            return ["remove", "Unknown state :()"]
        }
    }
    private getProgressInfo(started: boolean, done: boolean): number {
        if (!started) {
            return 0
        } else if (started && !done) {
            const startTime = this.props.task.startDate.getTime()
            const endTime = this.getEndDate().getTime()
            const currentTime = (new Date()).getTime()

            const ratio = Math.round(100 * (currentTime - startTime) / (endTime - startTime))

            return ratio
        } else if (done) {
            return 100
        } else {
            return 0
        }
    }
    private getStartState(): [string, string] {
        const diff = dateutils.getDateDiff(this.props.task.estimatedStartDate, this.props.task.startDate)
        if (diff <= 0) {
            return ["success", "On time"]
        } else {
            return ["warning", "Late " + diff + " days"]
        }
    }
    private getStartDateLabel(started: boolean, milestone: boolean): string {
        const startDateLabel = dateutils.getDateLabel(this.props.task.startDate)
        if (started) {
            return milestone ? "Reached the " + startDateLabel : "Started the " + startDateLabel
        } else {
            return milestone ? "Will be reached the " + startDateLabel : "Starting the " + startDateLabel
        }
    }
    private getStartTodayDiff(): string {
        const diff = dateutils.getDateDiff(new Date(), this.props.task.startDate)
        if (diff > 0) {
            return "In " + diff + " days"
        } else if (diff < 0) {
            return "" + (-diff) + " days ago"
        } else {
            return "Today"
        }
    }
    private getEndState(endDate: Date): [string, string] {
        const diff = dateutils.getDateDiff(this.getEstimatedEndDate(), endDate)
        if (diff <= 0) {
            return ["success", "On time"]
        } else {
            return ["warning", "Late " + diff + " days"]
        }
    }
    private getEndDateLabel(done: boolean, endDate: Date): string {
        const endDateLabel = dateutils.getDateLabel(endDate)
        if (done) {
            return "Done the " + endDateLabel
        } else {
            return "Ending the " + endDateLabel
        }
    }
    private getEndTodayDiff(endDate: Date): string {
        const diff = dateutils.getDateDiff(new Date(), endDate)
        if (diff > 0) {
            return "In " + diff + " days"
        } else if (diff < 0) {
            return +(-diff) + " days ago"
        } else {
            return "Today"
        }
    }
}
