import React from 'react';
import ReportStep from './ReportStep';
import { getDuration } from '../supportMethods';
import ToggleDisplay from 'react-toggle-display';

class ReportScenario extends React.Component {

    constructor(props) {
        super(props);
        this.state = {scenarioData: props.scenarioData, uri: props.uri, showScenario: false, prefix: "+"};
    }

    toggleShowScenario() {
    	if(this.state.showScenario === false) {
    		this.setState({showScenario: true, prefix: "-"});
    	} else {
    		this.setState({showScenario: false, prefix: "+"});
    	}
    }

    render() {

    	let styleClass = "card border-success mb-3";
    	let statusBadge = 'badge badge-success';
    	let resultSummary = this.state.scenarioData.stats.passed + ' of ' + this.state.scenarioData.stats.total;
    	if(this.state.scenarioData.stats.status === "failed") {
			styleClass = "card border-danger mb-3";
			statusBadge = 'badge badge-danger';
			resultSummary = this.state.scenarioData.stats.failed + ' of ' + this.state.scenarioData.stats.total;
		}
		const duration = getDuration(this.state.scenarioData.stats.duration);
        const { scenarioData } = this.state;
        let stepCount = 0;
        const ReportStepView = scenarioData.steps.map((step) => {
        	const viewKey = this.state.scenarioData.id + step.line + stepCount;
        	stepCount++;
            return <ReportStep key={viewKey} stepData={step} uri={this.state.uri} />;
        });    	    	
        return (
            <div className={styleClass} >
                <div className="card-header" onClick={this.toggleShowScenario.bind(this)}>
                	<span> {this.state.prefix} <span className={statusBadge}>{resultSummary} {this.state.scenarioData.stats.status} in {duration}s</span> {this.state.scenarioData.keyword}: {this.state.scenarioData.name}</span>
                </div>
                <ToggleDisplay if={this.state.showScenario === true}>
	                <div className="card-body">     
		                <div className="card border-primary mb-3">
		                	<div className="card-header">
		                		Source: {this.state.uri} @ line {this.state.scenarioData.line}
		                	</div>
		                </div>
		                {ReportStepView}
	                </div>
	            </ToggleDisplay>
            </div>
        );
    }
}

export default ReportScenario;
