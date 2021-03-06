import * as React from "react"
import { Grid, Col } from "react-bootstrap"

interface OverviewProperties {
    visible: boolean
}

export class Overview extends React.Component<OverviewProperties, {}> {
    render() {
        return <Grid className={this.props.visible ? "" : "hidden"}>
            <Col id="main" xs={12} sm={10}>
                <h2 className="title-h2">Overview</h2>
                <p>(Under construction)</p>
            </Col>
        </Grid>
    }
}
