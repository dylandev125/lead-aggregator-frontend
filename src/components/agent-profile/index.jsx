import React, {Component} from 'react';
import {compose} from 'recompose';
import {
    Segment, Grid, Button, Select, Form, Header, Menu, Popup, Icon
} from 'semantic-ui-react';
import './index.scss';
import {AgentsContainer, BreadCrumbContainer, AgentFormContainer} from "@containers";
import ChartJs from 'chart.js';
import DatePickerSelect from "components/@common/datepicker";
import * as moment from 'moment';
import AgentModal from '../@common/modals/agent';
import {Auth} from "@services";
import {disableAutoComplete} from '../../utils';

class AgentProfile extends Component {
    state = {
        companyIds: [],
        startDateDisplay: moment().startOf('isoWeek').format('MM/DD/Y'),
        endDateDisplay: moment().endOf('isoWeek').format('MM/DD/Y'),
        startDate: moment().startOf('isoWeek').format('Y-MM-DD'),
        endDate: moment().endOf('isoWeek').format('Y-MM-DD'),
    };

    constructor(props) {
        super(props);
        this.canvas = React.createRef();
    }

    componentWillMount() {
        const { agentId } = this.props;
        this.props.getAgent(agentId, true);
    }

    componentDidMount() {
        let opt = this.props.graphContactedLeadsAverage;
        opt.options.legendCallback = function (chart) {
            let ul = document.createElement('ul');
            chart.data.datasets.forEach(function (item) {
                ul.innerHTML += `<li style="display: inline; margin-right: 10px"><div style="background-color: ${item['backgroundColor']}; border: ${item['borderColor']} solid ${item['borderWidth']}px; width: 40px; height: 10px; display: inline-block; margin-right: 5px"></div>${item['label']}</li>`;
            });
            return ul.outerHTML;
        };

        this.Chart = new ChartJs(this.canvas.current.getContext('2d'), opt);
        this.props.getAgentGraph(this.Chart, this.agentId, {
            companyIds: this.state.companyIds,
            graphType: 'contacted',
            startDate: this.state.startDate,
            endDate: this.state.endDate,
        });
        this.Chart.data = this.props.graphContactedLeadsAverage.data;
        this.Chart.update();
        this.props.addBreadCrumb({
            name: 'Agents',
            path: '/agents',
        });
        this.refs.legend.innerHTML = this.Chart.generateLegend();
        disableAutoComplete();
    }

    onChangeCompany = (event, data) => {
        this.setState({
            ...this.state,
            companyIds: data.value,
        });

        this.props.getAgentGraph(this.Chart, this.agentId, {
            companyIds: data.value,
            graphType: 'contacted',
            startDate: this.state.startDate,
            endDate: this.state.endDate,
        });
    };

    onChangeDateFrom = (date) => {
        this.setState({
            ...this.state,
            startDate: moment(date).format('Y-MM-DD'),
            startDateDisplay: moment(date).format('MM/DD/Y'),
        });
    };

    onChangeDateTo = (date) => {
        this.setState({
            ...this.state,
            endDate: moment(date).format('Y-MM-DD'),
            endDateDisplay: moment(date).format('MM/DD/Y'),
        });

        this.props.getAgentGraph(this.Chart, this.agentId, {
            companyIds: this.state.companyIds,
            graphType: 'contacted',
            startDate: this.state.startDate,
            endDate: moment(date).format('Y-MM-DD'),
        });
    };

    onRestDate = () => {
        this.setState({
            ...this.state,
            startDateDisplay: moment().startOf('isoWeek').format('MM/DD/Y'),
            endDateDisplay: moment().endOf('isoWeek').format('MM/DD/Y'),
            startDate: moment().startOf('isoWeek').format('Y-MM-DD'),
            endDate: moment().endOf('isoWeek').format('Y-MM-DD'),
        });

        this.props.getAgentGraph(this.Chart, this.agentId, {
            companyIds: this.state.companyIds,
            graphType: 'contacted',
            startDate: moment().startOf('isoWeek').format('Y-MM-DD'),
            endDate: moment().endOf('isoWeek').format('Y-MM-DD'),
        });
    };

    onEditAgent = () => {
        this.props.loadForm({...this.props.agent, show: true})
    };

    onMouseLeave = () => {
        if (typeof this.props.onClose !== 'undefined') {
            this.props.onClose();
        }
    }

    render() {
        const {startDateDisplay, endDateDisplay, startDate, endDate} = this.state;
        return (<div className='AgentProfile' onMouseLeave={this.onMouseLeave}>
            <AgentModal/>
            <Segment attached='top'>
                <Grid>
                    <Grid.Column>
                        <Header floated='left' as='h1'>Agent profile</Header>
                    </Grid.Column>
                </Grid>
                <Grid columns={2}>
                    <Grid.Column>
                        <Form>
                            <Form.Group widths='equal'>
                                {
                                    Auth.isAgency ? <Form.Field
                                            control={Select}
                                            options={this.props.selectBoxAgentCompanies}
                                            label={{children: '', htmlFor: 'agents-list'}}
                                            placeholder='Select Company'
                                            search
                                            onChange={this.onChangeCompany}
                                            searchInput={{id: 'agents-list'}}
                                        />
                                        : null
                                }
                                <Popup position='bottom left'
                                       trigger={
                                           <Form.Field>
                                               <Button>
                                                   <Icon name='calendar alternate outline'/>
                                                   {startDateDisplay} - {endDateDisplay}
                                               </Button>
                                           </Form.Field>} flowing hoverable>

                                    <DatePickerSelect onChangeDateFrom={this.onChangeDateFrom}
                                                      onChangeDateTo={this.onChangeDateTo}
                                                      onRestDate={this.onRestDate}
                                                      from={new Date(startDate)} to={new Date(endDate)}
                                    />
                                </Popup>
                            </Form.Group>
                        </Form>
                    </Grid.Column>
                    <Grid.Column>
                        <Menu secondary>
                            <Menu.Menu position='right'>
                                <Button color='teal' content='Edit Agent' onClick={this.onEditAgent}
                                        labelPosition='left'/>
                            </Menu.Menu>
                        </Menu>
                    </Grid.Column>
                </Grid>
                <Segment className='average-response-time' basic>
                    <div ref='legend'/>
                    <canvas ref={this.canvas}/>
                    <label className='average-response-time-label'>Average response
                        time: {this.props.averageResponseTime}</label>
                </Segment>

            </Segment>
        </div>)
    }
}

export default compose(AgentFormContainer, BreadCrumbContainer, AgentsContainer)(AgentProfile);
