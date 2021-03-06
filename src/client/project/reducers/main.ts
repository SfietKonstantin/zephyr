import { combineReducers, Action } from "redux"
import { projectReducer } from "./project"
import { tasksReducer } from "./tasks"
import { State } from "../types"

const initialState: string = ""

const identifierReducer = (state: string = initialState, action: Action): string => {
    return state
}

export const mainReducer = combineReducers<State>({
    projectIdentifier: identifierReducer,
    project: projectReducer,
    tasks: tasksReducer
})
