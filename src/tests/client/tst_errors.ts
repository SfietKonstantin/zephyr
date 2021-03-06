import * as chai from "chai"
import { processError, ErrorResponseError } from "../../client/common/actions/errors"
import { FakeResponse } from "./fakeresponse"

describe("Errors processing", () => {
    it("Should process valid JSON", (done) => {
        const response = new FakeResponse(true, { test: "value" })
        processError(response).then((result: any) => {
            chai.expect(result).to.deep.equal({ test: "value" })
            done()
        }).catch((error) => {
            done(error)
        })
    })
    it("Should react to HTTP error", (done) => {
        const response = new FakeResponse(false, {error: "Error message"})
        processError(response).then((result: string | null) => {
            done(new Error("Should not be a success"))
        }).catch((error) => {
            chai.expect(error).to.instanceOf(ErrorResponseError)
            chai.expect((error as ErrorResponseError).message).to.equal("Error message")
            done()
        }).catch((error) => {
            done(error)
        })
    })
    it("Should react to HTTP error without cause", (done) => {
        const response = new FakeResponse(false, {})
        processError(response).then((result: string | null) => {
            done(new Error("Should not be a success"))
        }).catch((error) => {
            chai.expect(error).to.instanceOf(ErrorResponseError)
            done()
        }).catch((error) => {
            done(error)
        })
    })
    it("Should react to JSON parsing error", (done) => {
        const response = new FakeResponse(true, {}, true)
        processError(response).then((result: string | null) => {
            done(new Error("Should not be a success"))
        }).catch((error) => {
            chai.expect(error).to.instanceOf(ErrorResponseError)
            done()
        }).catch((error) => {
            done(error)
        })
    })
    it("Should not react when there is no body", (done) => {
        let response = new FakeResponse(true, {})
        response.status = 201
        processError(response).then((result: string | null) => {
            chai.expect(result).to.null
            done()
        }).catch((error) => {
            done(error)
        })
    })
})
