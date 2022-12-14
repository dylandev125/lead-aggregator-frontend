import React, { Component } from "react";
import {Button, Form, Icon, Popup, Select} from "semantic-ui-react";
import * as moment from "moment";
import {compose} from "recompose";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import DatePickerSelect from "../../@common/datepicker";
import {AgentsContainer, CompaniesContainer} from "../../../@containers";

import './index.scss';

class CompanyLeadStats extends Component {
    dateDisplayFormat = 'MM/DD/Y';

    state = {
        agentId: null,
        startDateDisplay: moment().startOf('isoWeek').format(this.dateDisplayFormat),
        endDateDisplay: moment().endOf('isoWeek').format(this.dateDisplayFormat),
        startDate: moment().startOf('isoWeek').format('Y-MM-DD'),
        endDate: moment().endOf('isoWeek').format('Y-MM-DD'),
    };

    onChangeDateFrom = (date) => {
        this.setState({
            ...this.state,
            startDate: moment(date).format('Y-MM-DD'),
            startDateDisplay: moment(date).format(this.dateDisplayFormat),
        });
    };

    onChangeDateTo = (date) => {
        this.setState({
            ...this.state,
            endDate: moment(date).format('Y-MM-DD'),
            endDateDisplay: moment(date).format(this.dateDisplayFormat),
        });

        this.props.getCompanyLeadStats(
            this.props.company.id,
            this.state.startDate,
            moment(date).format('Y-MM-DD'),
            this.state.agentId,
        );
    };

    onRestDate = () => {
        this.setState({
            ...this.state,
            startDateDisplay: moment().startOf('isoWeek').format(this.dateDisplayFormat),
            endDateDisplay: moment().endOf('isoWeek').format(this.dateDisplayFormat),
            startDate: moment().startOf('isoWeek').format('Y-MM-DD'),
            endDate: moment().endOf('isoWeek').format('Y-MM-DD'),
        });

        this.props.getCompanyLeadStats(
            this.props.company.id,
            moment().startOf('isoWeek').format('Y-MM-DD'),
            moment().endOf('isoWeek').format('Y-MM-DD'),
            this.state.agentId,
        );
    };

    onChangeAgent = (event, data) => {
        this.setState({
            ...this.state,
            agentId: data.value,
        });

        this.props.getCompanyLeadStats(
            this.props.companyObject.id,
            this.state.startDate,
            this.state.endDate,
            this.state.agentId,
        );
    };

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.companyObject.id !== prevProps.companyObject.id) {
            this.props.getCompanyLeadStats(
                this.props.companyObject.id,
                this.state.startDate,
                this.state.endDate,
                this.state.agentId,
            );

            this.props.loadSelectBoxAgents({
                companyId: this.props.companyObject.id
            });
        }
    }


    componentDidMount() {
        this.props.getCompanyLeadStats(
            this.props.companyObject.id,
            this.state.startDate,
            this.state.endDate,
            this.state.agentId,
        );

        this.props.loadSelectBoxAgents({
            companyId: this.props.companyObject.id
        });
    }

    render() {
        const { onClose, agents, company, companyLeadStats, companyLeadStatsRecords } = this.props;
        const { startDateDisplay, endDateDisplay, startDate, endDate } = this.state;

        return (
            <div className="companyLeadStats">
                <Icon name="close" onClick={(e) => onClose(e)} />
                <div className="company-name-header">
                    <label>Selected</label>
                    <div className="company-name">{company.name}</div>
                </div>
                <div className="company-lead-stats-container">
                    <label>Lead Stats</label>
                    <div className="filters">
                        <Popup position='bottom left'
                               trigger={
                                   <Form.Field>
                                       <Button>
                                           <Icon name='calendar alternate outline'/>
                                           {startDateDisplay} - {endDateDisplay}
                                       </Button>
                                   </Form.Field>} flowing hoverable>

                            <DatePickerSelect
                                onChangeDateFrom={this.onChangeDateFrom}
                                onChangeDateTo={this.onChangeDateTo}
                                onRestDate={this.onRestDate}
                                from={new Date(startDate)} to={new Date(endDate)}
                            />
                        </Popup>

                        <Form.Field
                            control={Select}
                            options={[...agents, ...this.props.selectBoxAgents]}
                            label={{children: '', htmlFor: 'agents-list'}}
                            placeholder='Company agents'
                            search
                            onChange={this.onChangeAgent}
                            searchInput={{id: 'agents-list'}}
                        />
                    </div>

                    <BarChart
                        width={300}
                        height={250}
                        data={companyLeadStatsRecords}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="total_leads_count" name="Total Leads" fill="#8884d8" />
                        <Bar dataKey="total_leads_converted" name="Converted Leads" fill="#82ca9d" />
                    </BarChart>

                    <div className="averages">
                        <label>AVR Response Time</label>
                        <span className="value">
                            {companyLeadStats.avg_lead_response_formatted || ''}
                        </span>
                    </div>

                    <div className="totals">
                        <div className="total-leads">
                            <span className="value">
                                {companyLeadStats.total_leads_count || 0}
                            </span>
                            <label>Total Leads</label>
                        </div>
                        <div className="total-leads-converted">
                            <span className="value">
                                {companyLeadStats.total_leads_converted || 0}
                            </span>
                            <label>Conversions</label>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default compose(CompaniesContainer, AgentsContainer)(CompanyLeadStats);

