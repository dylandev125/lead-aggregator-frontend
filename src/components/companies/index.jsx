import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { compose } from 'recompose';
import * as R from 'ramda';

import { CompaniesContainer, BreadCrumbContainer, CompanyFormContainer } from '@containers';
import Loader from '../loader';
import CompanyModal from '../@common/modals/company';
import {
  Table,
  Segment,
  Pagination,
  Button,
  Header,
  Form,
  Input,
  Icon,
  Grid,
  Menu,
  Confirm, Tab,
} from 'semantic-ui-react';
import './index.scss';
import {AvatarImage} from "../@common/image";
import * as moment from 'moment';
import {DATE_FORMAT} from '@constants';
import ButtonGroup from "components/@common/button-group";
import {disableAutoComplete} from '../../utils';
import CompanyLeadStats from "./company-lead-stats";

class Companies extends Component {
  state = {
    open: false,
    companyId: null,
    ready: false,
    companyStats: {},
    activeIndex: 0,
  };

  componentWillMount() {
    this.props.addBreadCrumb({
      name: 'Companies',
      path: '/companies',
      active: true,
    }, true);
    this.props.loadCompanies();
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

  onSearch = event => this.props.searchCompanies(event.target.value);

  loadCompanies = (event, data) => {
    this.props.gotoCompaniesPage(data.activePage);
  };

  openConfirmModal = (open = true, companyId = null) => {
    this.setState({open, companyId});
  };

  onConfirm = () => {
    this.setState({open: false});
    this.props.deleteCompany(this.state.companyId);
  };

  onShowArch = (e, tab) => {
    if (tab.activeIndex === this.state.activeIndex) {
      return;
    }

    this.setState({
      ...this.state,
      activeIndex: tab.activeIndex,
    });

    this.props.toggleShowDeleted();
  };

  onLockCompany = (company) => {
    company.is_locked = +!company.is_locked;
    this.props.updateLockStatusCompany(company);
  };

  onShowCompanyStats = (companyStats) => {
    this.setState({
      ...this.state,
      companyStats,
    })
  }

  onCloseCompanyStats = () => {
    this.setState({
      ...this.state,
      companyStats: null,
    })
  }

  componentDidMount() {
    disableAutoComplete();
  }
  
  componentWillUnmount() {
    this.setState({
      ...this.state,
      companyStats: null,
    });
  }

  render() {
    const companies = this.props.companies || [];
    const {pagination, query} = this.props;
    const { companyStats } = this.state;

    const tabs = [
      {
        menuItem: 'Active',
        render: () => <></>
      },
      {
        menuItem: 'Archived',
        render: () => <></>
      }
    ];

    return (
      <div className='Companies'>
        <CompanyModal/>
        <Segment attached='top'>
          <Confirm open={this.state.open} onCancel={this.openConfirmModal.bind(this, false)}
                   onConfirm={this.onConfirm}/>
          <Grid columns={2}>
            <Grid.Column>
              <Header floated='left' as='h1'>Companies</Header>
              <Form.Field>
                <Tab onTabChange={this.onShowArch} menu={{ secondary: true, pointing: true }} panes={tabs} />
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Menu secondary>
                <Menu.Menu position='right'>
                  <Menu.Item>
                    <Input icon='search'
                           onChange={this.onSearch}
                           value={query.search} placeholder='Search...'/>
                  </Menu.Item>
                  <Button color='teal' onClick={this.props.loadForm.bind(this, {show: true})}
                          content='New Company'/>
                </Menu.Menu>
              </Menu>
            </Grid.Column>
          </Grid>
          <Segment basic>
            <Loader/>
            <Table singleLine>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>
                    Logo
                  </Table.HeaderCell>
                  <Table.HeaderCell>Name
                    <Icon name={this.getSort('name')}
                          onClick={this.props.sort.bind(this, 'name')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Campaigns
                    <Icon name={this.getSort('deals')}
                          onClick={this.props.sort.bind(this, 'deals')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Leads <Icon name={this.getSort('leads')}
                                                onClick={this.props.sort.bind(this, 'leads')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Agents
                    <Icon name={this.getSort('agents')}
                          onClick={this.props.sort.bind(this, 'agents')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Avg Response time
                    <Icon name={this.getSort('avg_response')}
                          onClick={this.props.sort.bind(this, 'avg_response')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell><span className="linearicons-cog"/></Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {
                  companies.map((company, index) => (
                    <Table.Row key={index}>
                      <Table.Cell onClick={() => this.onShowCompanyStats(company)}>
                        <AvatarImage src={company.avatar_path} avatar rounded size='medium'/>
                      </Table.Cell>
                      <Table.Cell onClick={() => this.onShowCompanyStats(company)}>
                        <div>
                          <Link to={`/companies/${company.id}/profile`}>{company.name}</Link>
                        </div>
                        <span
                          className='date-added'>Added {moment.utc(company.created_at).local().format(DATE_FORMAT)}</span>
                      </Table.Cell>
                      <Table.Cell onClick={() => this.onShowCompanyStats(company)}><Link
                        to={`/companies/${company.id}/deals`}>{company.deals_count}</Link></Table.Cell>
                      <Table.Cell onClick={() => this.onShowCompanyStats(company)}>
                        <Link to={`/companies/${company.id}/leads`}>{company.leads_count}</Link></Table.Cell>
                      <Table.Cell onClick={() => this.onShowCompanyStats(company)}>
                        <Link to={`/companies/${company.id}/agents`}>
                          {company.agents && company.agents.map((agent, i) => <>
                            <span className="agent-name">{agent.name}</span>
                            {company.agents.length > 1 && i !== company.agents.length - 1 ? ', ' : ''}
                          </>)}
                        </Link>
                      </Table.Cell>
                      <Table.Cell onClick={() => this.onShowCompanyStats(company)}>{company.avg_lead_response || 0}</Table.Cell>
                      <Table.Cell>
                        {
                          !company.is_deleted ?
                            <div>
                              <Button id="company-lock" onClick={this.onLockCompany.bind(this, company)}>
                                <Icon className={company.is_locked ? 'linearicons-lock' : 'linearicons-shield-check'}/>
                              </Button>
                              <ButtonGroup>
                                <Button onClick={this.props.loadForm.bind(this, {
                                  ...company,
                                  show: true,
                                })}>Edit</Button>
                                <Button onClick={this.openConfirmModal.bind(this, true, company.id)}>Archive</Button>
                              </ButtonGroup>
                            </div>
                            : null
                        }
                      </Table.Cell>
                    </Table.Row>
                  ))
                }

              </Table.Body>
            </Table>
          </Segment>
          { companyStats && <CompanyLeadStats companyObject={companyStats} onClose={this.onCloseCompanyStats} /> }
        </Segment>
        <Segment textAlign='right' attached='bottom'>
          <Pagination onPageChange={this.loadCompanies}
                      defaultActivePage={pagination.current_page}
                      prevItem={null}
                      nextItem={null}
                      totalPages={pagination.last_page}/>
        </Segment>
      </div>
    );
  }
}

export default compose(CompaniesContainer, CompanyFormContainer, BreadCrumbContainer)(Companies);