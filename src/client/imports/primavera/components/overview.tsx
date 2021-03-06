import * as React from "react"
import { Dispatch } from "redux"
import { Button, ButtonGroup, Badge } from "react-bootstrap"
import { State, Stage, SubmitState } from "../types"
import { StagePanel } from "./stagepanel"
import { WarningsButton } from "./warningsbutton"
import { defineStage, defineMaxStage } from "../actions/stages"
import { submit } from "../actions/overview"
import { Project, TaskRelation, DelayRelation } from "../../../../common/types"
import { ApiInputTask, ApiInputDelay } from "../../../../common/apitypes"
import * as maputils from "../../../../common/maputils"

interface OverviewProperties {
    stage: Stage
    maxStage: Stage
    totalTasks: number
    project: Project
    tasks: Array<ApiInputTask>
    delays: Array<ApiInputDelay>
    totalRelations: number
    taskRelations: Array<TaskRelation>
    delayRelations: Array<DelayRelation>
    warnings: Map<string, Array<string>>
    submitState: SubmitState
    onCurrentStage: () => void
    onSubmit: (project: Project, tasks: Array<ApiInputTask>, delays: Array<ApiInputDelay>,
               taskRelations: Array<TaskRelation>, delayRelations: Array<DelayRelation>) => void
}

export class Overview extends React.Component<OverviewProperties, {}> {
    render() {
        const tasksLength = this.props.tasks.length
        const delaysLength = this.props.delays.length
        const relationsLength = this.props.taskRelations.length + this.props.delayRelations.length
        let warningsButton: JSX.Element | null = null
        let totalWarnings = maputils.lengthOfMapOfList(this.props.warnings)
        if (totalWarnings > 0) {
            warningsButton = <WarningsButton warnings={this.props.warnings} />
        }
        const projectIdentifierLength = this.props.project.identifier.length
        const canImport = projectIdentifierLength > 0
                          && this.props.project.name.length > 0
                          && tasksLength > 0 && relationsLength > 0
                          && this.props.submitState !== SubmitState.Submitted
        return <StagePanel displayStage={Stage.Overview}
                           currentStage={this.props.stage}
                           maxStage={this.props.maxStage} title="5. Overview"
                           warnings={totalWarnings}
                           onCurrent={this.props.onCurrentStage.bind(this)}>
            <p>
                <Badge>{tasksLength}</Badge>
                <span> tasks and </span>
                <Badge>{delaysLength}</Badge>
                <span> delays of the {this.props.totalTasks} tasks will be imported</span>
            </p>
            <p>
                <Badge>{relationsLength}</Badge>
                <span> of the {this.props.totalRelations} relations will be imported</span>
            </p>
            <ButtonGroup>
                <Button bsStyle={this.getButtonStyle()} disabled={!canImport} onClick={this.handleSubmit.bind(this)}>
                    {this.getButtonText()}
                </Button>
                {warningsButton}
            </ButtonGroup>
        </StagePanel>
    }
    private handleSubmit(e: React.MouseEvent) {
        this.props.onSubmit(this.props.project, this.props.tasks, this.props.delays,
                            this.props.taskRelations, this.props.delayRelations)
    }
    private getButtonStyle(): string {
        switch (this.props.submitState) {
            case SubmitState.Idle:
                return "primary"
            case SubmitState.Submitted:
                return "success"
            case SubmitState.SubmitError:
                return "danger"
            default:
                return "default"
        }
    }
    private getButtonText(): string {
        switch (this.props.submitState) {
            case SubmitState.Submitting:
                return "Importing"
            case SubmitState.Submitted:
                return "Import successful"
            case SubmitState.SubmitError:
                return "Import failed"
            default:
                return "Import"
        }
    }
}

export const mapStateToProps = (state: State) => {
    return {
        stage: state.stage.current,
        maxStage: state.stage.max,
        project: state.project,
        totalTasks: state.tasks.length,
        tasks: state.overview.tasks,
        delays: state.overview.delays,
        totalRelations: state.relations.length,
        taskRelations: state.overview.taskRelations,
        delayRelations: state.overview.delayRelations,
        warnings: state.overview.warnings,
        submitState: state.overview.submitState,
    }
}

export const mapDispatchToProps = (dispatch: Dispatch<State>) => {
    return {
        onCurrentStage: () => {
            dispatch(defineStage(Stage.Overview))
        },
        onSubmit: (project: Project, tasks: Array<ApiInputTask>, delays: Array<ApiInputDelay>,
                   taskRelations: Array<TaskRelation>, delayRelations: Array<DelayRelation>) => {
            dispatch(submit(project, tasks, delays, taskRelations, delayRelations))
        },
    }
}
