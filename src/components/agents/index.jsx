import React, {Component} from 'react';
import {compose} from 'recompose';
import {BreadCrumbContainer, AgentsContainer, AgentFormContainer} from '@containers';
import AgentModal from '../@common/modals/agent';
import {
    Button,
    Checkbox,
    Confirm,
    Form,
    Grid,
    Header,
    Input,
    Menu,
    Pagination,
    Segment,
    Select,
} from 'semantic-ui-react';
import './index.scss';
import Loader from '../loader';
import * as R from "ramda";
import {CompaniesContainer} from "@containers";
import {Auth} from "@services";
import {AvatarImage} from "../@common/image";
import ButtonGroup from 'components/@common/button-group';
import {disableAutoComplete} from '../../utils';
import AgentProfile from "../agent-profile";
import avatarDemo from "../@common/forms/avatar-demo.png";

const companies = [
    {key: null, text: 'All companies', value: null},
];

class Agents extends Component {
    state = {
        open: false,
        agentId: null,
        companyId: null,
    };

    componentWillMount() {
        const companyId = +R.pathOr('', ['match', 'params', 'companyId'], this.props);
        this.props.addBreadCrumb({
            name: 'Agents',
            path: '/agents'
        });
        this.props.filterAgents({
            companyId
        });

        if (Auth.isAgency) {
            this.props.loadSelectBoxCompanies();
        }

        this.setState({
            ...this.state,
            companyId: companyId
        })
    }

    getSort = field => {
        const fieldStatus = R.path(['query', 'sort', field], this.props);
        if (fieldStatus === true) {
            return 'sort amount down';
        }
        if (fieldStatus === false) {
            return 'sort amount up';
        }
        return 'sort';
    };

    onSearch = (event, data) => {
        this.props.search(data.value);
    };

    gotoPage = (event, data) => {
        this.props.gotoPage(data.activePage);
    };

    openConfirmModal = (open = true, agentId = null) => {
        this.setState({open, agentId});
    };

    onConfirm = () => {
        this.setState({open: false});
        this.props.delete(this.state.agentId);
    };

    onRestore = (agentId) => {
        this.props.restore(agentId);
    };

    onShowArch = () => {
        this.props.toggleShowDeleted();
    };

    onChangeCompany = (event, data) => {
        this.props.filterAgents({
            companyId: data.value
        });
    };

    onClickViewAgentProfile = (agentId) => {
        this.setState({
            ...this.state,
            agentId,
        })
    }

    componentDidMount() {
        disableAutoComplete();
    }

    render() {
        const agents = this.props.agents || [];
        const {pagination, query} = this.props;
        const {companyId, agentId } = this.state;
        return (
            <div className='Agents'>
                <AgentModal/>
                {
                    agentId && <AgentProfile agentId={agentId} onClose={() => this.onClickViewAgentProfile(null)} />
                }
                <Confirm open={this.state.open} onCancel={this.openConfirmModal.bind(this, false)}
                         onConfirm={this.onConfirm}/>
                <Segment attached='top'>
                    <Grid columns={2}>
                        <Grid.Column>
                            <Header floated='left' as='h1'>Agents</Header>
                            <Form.Field>
                                <Checkbox label='Show Archived' checked={this.props.query.showDeleted} toggle onChange={this.onShowArch}/>
                            </Form.Field>
                            <Form>
                                {
                                    Auth.isAgency
                                        ? <Form.Field
                                            control={Select}
                                            options={[...companies, ...this.props.selectBoxCompanies]}
                                            label={{children: 'Filter', htmlFor: 'form-companies-list'}}
                                            placeholder='All companies'
                                            search
                                            onChange={this.onChangeCompany}
                                            defaultValue={companyId || null}
                                            searchInput={{id: 'form-companies-list'}}
                                        />
                                        : null
                                }
                            </Form>
                        </Grid.Column>
                        <Grid.Column>
                            <Menu secondary>
                                <Menu.Menu position='right'>
                                    <Menu.Item>
                                        <Input icon='search' onChange={this.onSearch} value={query.search || ''}
                                               placeholder='Search...'/>
                                    </Menu.Item>
                                    <Button color='teal' onClick={this.props.loadForm.bind(this, {show: true})}
                                            content='New Agent'/>
                                </Menu.Menu>
                            </Menu>
                        </Grid.Column>
                    </Grid>
                    <Segment basic>
                        <Loader/>
                            {
                                agents.map((agent, index) => (
                                    <div className="agentContainer" onClick={() => this.onClickViewAgentProfile(agent.id)}>
                                        <div className="agentMenu">
                                            <div className="bullets">...</div>
                                            {
                                                !agent.deleted_at && (
                                                  <ButtonGroup>
                                                      <Button onClick={this.props.loadForm.bind(this, {
                                                          ...agent,
                                                          show: true
                                                      })}>Edit</Button>
                                                      <Button onClick={this.openConfirmModal.bind(this, true, agent.id)}>Archive</Button>
                                                  </ButtonGroup>
                                                ) || (
                                                  <ButtonGroup>
                                                      <Button onClick={this.props.loadForm.bind(this, {
                                                          ...agent,
                                                          show: true
                                                      })}>Edit</Button>
                                                      <Button onClick={() => this.onRestore(agent.id)}>Restore</Button>
                                                  </ButtonGroup>
                                                )
                                            }
                                        </div>
                                        <div className="agentDetails">
                                            <div className="agentAvatar">
                                                <div className="legend">
                                                    <span className="legendCount">
                                                        {agent.leads_count}
                                                    </span>
                                                    <span className="legendName">
                                                        Leads
                                                    </span>
                                                    <AvatarImage size='tiny' circular src={agent.avatar_path || avatarDemo}/>
                                                </div>
                                                
                                                <div className="agentName">
                                                    {agent.name}
                                                </div>
                                            </div>
                                            <div className="integrationCount">
                                                <span>
                                                    {agent.integration_count || 0}
                                                    &nbsp;
                                                    Integrations
                                                </span>
                                            </div>
                                            <div className="campaignStatus">
                                                <button class="ui teal button">Active</button>
                                            </div>
                                            {
                                                agent.deals && (
                                                  <div className="campaignNames">
                                                      <span>assigned to</span>
                                                      {
                                                          agent.deals && agent.deals.map(({name}) => <div className="campaignName">{name}</div>)
                                                      }
                                                  </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                ))
                            }
                    </Segment>
                </Segment>
                <Segment textAlign='right' attached='bottom'>
                    <Pagination onPageChange={this.gotoPage}
                                defaultActivePage={pagination.current_page}
                                prevItem={null}
                                nextItem={null}
                                totalPages={pagination.last_page}/>
                </Segment>
            </div>)
    }
}

export default compose(BreadCrumbContainer, CompaniesContainer, AgentsContainer, AgentFormContainer)(Agents);
