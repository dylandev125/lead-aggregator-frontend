import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {compose} from 'recompose';
import './index.scss';
import {
  AgentsContainer,
  BreadCrumbContainer,
  CampaignFormContainer,
  CampaignsContainer,
  OptinFormIntegrationContainer,
  ProfileContainer,
  MessagesContainer,
} from "@containers";
import Loader from '../loader';
import {
  Segment, Confirm, Checkbox, Header, Menu, Form,
  Grid, Button, Table, Icon, Pagination,
} from 'semantic-ui-react';
import * as R from "ramda";
import CampaignModal from 'components/@common/modals/campaign';
import ModalOptinFormIntegration from 'components/@common/modals/integrations/optinform';
import ZapierIntegrationModal from "../@common/modals/integrations/zapier";
import InstapageIntegrationModal from "../@common/modals/integrations/instapage";
import ClickFunnelsIntegrationModal from "../@common/modals/integrations/clickfunnels";
import UnbounceIntegrationModal from "../@common/modals/integrations/unbounce";
import WebhookIntegrationModal from "../@common/modals/integrations/webhook";
import FacebookIntegrationModal from "../@common/modals/integrations/facebook";
import {Auth, config, Facebook} from "@services";
import ButtonGroup from "components/@common/button-group";
import {disableAutoComplete} from '../../utils';

class Campaigns extends Component {
  state = {
    open: false,
    openApiIntegration: false,
    openWebhookIntegration: false,
    openInstapageIntegration: false,
    openUnbounceIntegration: false,
    openClickFunnelsIntegration: false,
    openFBIntegration: false,
    campaignId: '',
    campaign: null,
    campaignLink: '',
    fbPages: [],
    companyId: '',
    dealId: '',
    fbIntegrations: [],
  };

  constructor(props) {
    super(props);
    const {companyId, dealId, agentId} = props.match.params;
    if (agentId) {
      props.loadAgentCampaigns(agentId);
    } else {
      props.loadDealCampaigns(companyId, dealId);
    }
  }

  componentWillMount() {
    const {companyId, agentId, dealId} = this.props.match.params;
    this.setState({
      ...this.state,
      companyId: +companyId || (Auth.isCompany ? this.props.profile.id : null),
      agentId: +agentId,
      dealId: +dealId,
    });
  }

  componentDidMount() {
    const deal = R.pathOr({
      name: 'Deal',
      company: {
        name: 'Company',
      }
    }, ['history', 'location', 'state', 'deal'], this.props);

    if (this.state.companyId) {
      this.props.addBreadCrumb({
        name: deal.name,
        path: '/dashboard',
      });
    }

    if (this.state.companyId && Auth.isAgency) {
      this.props.addBreadCrumb({
        name: deal.company.name,
        path: `/companies/${this.state.companyId}/profile`,
      });
    }

    if (this.state.companyId) {
      this.props.addBreadCrumb({
        name: 'Campaigns',
        path: '/',
        active: true,
      }, false);
    }


    if (this.state.agentId) {
      const agentName = R.pathOr('Agent', ['location', 'state', 'agent', 'name'], this.props);
      this.props.addBreadCrumb({
        name: 'Agents',
        path: `/agents`,
      });

      this.props.addBreadCrumb({
        name: agentName,
        path: `/agents/${this.state.agentId}/profile`,
      }, false);

      this.props.addBreadCrumb({
        name: 'Campaigns',
        path: '',
      }, false);
    }
    disableAutoComplete();
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

  openConfirmModal = (open = true, campaignId = '') => {
    this.setState({open, campaignId})
  };

  onConfirm = () => {
    this.setState({open: false});
    const {companyId, dealId} = this.props.match.params;
    this.props.deleteCampaign(companyId, dealId, this.state.campaignId);
  };

  onShowArch = () => {
    this.props.toggleShowDeleted();
  };

  gotoPage = (event, data) => {
    this.props.gotoPage(data.activePage);
  };

  loadIntegrationForm = async campaign => {
    if (campaign.integration === 'OPTIN_FORM') {
      this.props.loadOptinForm({
        ...campaign,
        companyId: campaign.company_id,
        dealId: campaign.deal_id,
        show: true
      })
    }

    const copyLink = `${config.get('REACT_APP_API_SERVER')}/v1/campaigns/${campaign.uuid}/leads`;

    if (campaign.integration === 'ZAPIER') {
      this.setState({
        ...this.state,
        campaignLink: copyLink,
        openApiIntegration: true,
      });
    }

    if (campaign.integration === 'WEBHOOK') {
      this.setState({
        ...this.state,
        campaignLink: copyLink,
        openWebhookIntegration: true,
      });
    }

    if (campaign.integration === 'UNBOUNCE') {
      this.setState({
        ...this.state,
        campaignLink: copyLink,
        openUnbounceIntegration: true,
      });
    }

    if (campaign.integration === 'INSTAPAGE') {
      this.setState({
        ...this.state,
        campaignLink: copyLink,
        openInstapageIntegration: true,
      });
    }

    if (campaign.integration === 'CLICKFUNNELS') {
      this.setState({
        ...this.state,
        campaignLink: copyLink,
        openClickFunnelsIntegration: true,
      });
    }

    if (campaign.integration === 'FACEBOOK') {
      await this.checkLoginState();
      this.setState({
        ...this.state,
        campaign,
        fbIntegrations: campaign.fbIntegrations,
      });
    }
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.campaigns && this.props.campaigns.length) {
      const campaign = this.props.campaigns.find(camp => camp.id == R.path(['campaign', 'id'], prevState));
      if (campaign && campaign.fbIntegrations && prevState.fbIntegrations &&
        (campaign.fbIntegrations.length !== prevState.fbIntegrations.length))
      this.setState({
        ...this.state,
        fbIntegrations: campaign.fbIntegrations,
      });
    }
  }

  statusChangeCallback = (response)  => {
    if (response.status === 'connected') {
      this.retrieveAccountFacebookPages();
    } else {
      window.FB.login((response) => {
        if (response.status === 'connected') {
          this.retrieveAccountFacebookPages();
          return;
        }
        this.props.sendMessage('Was not possible to login!', true);
      }, {
        scope: [
          'manage_pages',
          'business_management',
          'ads_management',
          'leads_retrieval',
        ],
      });
    }
  };

  async retrieveAccountFacebookPages() {
    try {
      const fbPages = await Facebook.getAccountPages();

      this.setState({
        ...this.state,
        openFBIntegration: true,
        fbPages: fbPages.map(
          page => ({ key: page.name, text: page.name, value: page })),
      });
    } catch (e) {
      this.props.sendMessage('Was not possible to retrieve facebook data!', true);
    }
  }

  checkLoginState = async (campaignId) => {
    const isLoggedIn = await Facebook.checkIsLoggedIn();
    if (isLoggedIn) {
      await this.retrieveAccountFacebookPages();
    } else {
      this.props.sendMessage('Was not possible to login!', true);
    }
  };

  onCloseApiIntegration = () => {
    this.setState({
      ...this.state,
      openApiIntegration: false,
      openFBIntegration: false,
      openInstapageIntegration: false,
      openWebhookIntegration: false,
      openUnbounceIntegration: false,
      openClickFunnelsIntegration: false,
    });
  };

  render() {
    const {campaigns, pagination} = this.props;
    const { dealId } = this.state;
    return (
      <div className='Campaigns'>
        <Segment attached='top'>

          <ZapierIntegrationModal open={this.state.openApiIntegration}
                                  onClose={this.onCloseApiIntegration}
                                  campaignLink={this.state.campaignLink}
          />

          <InstapageIntegrationModal open={this.state.openInstapageIntegration}
                                     onClose={this.onCloseApiIntegration}
                                     campaignLink={this.state.campaignLink}
          />

          <WebhookIntegrationModal open={this.state.openWebhookIntegration}
                                     onClose={this.onCloseApiIntegration}
                                     campaignLink={this.state.campaignLink}
          />

          <UnbounceIntegrationModal open={this.state.openUnbounceIntegration}
                                     onClose={this.onCloseApiIntegration}
                                     campaignLink={this.state.campaignLink}
          />

          <ClickFunnelsIntegrationModal open={this.state.openClickFunnelsIntegration}
                                     onClose={this.onCloseApiIntegration}
                                     campaignLink={this.state.campaignLink}
          />

          <FacebookIntegrationModal open={this.state.openFBIntegration}
                                    onClose={this.onCloseApiIntegration}
                                    fbPages={this.state.fbPages}
                                    campaign={this.state.campaign}
                                    fbIntegrations={this.state.fbIntegrations}
                                    subscribe={this.props.subscribeCampaignToFbIntegration}
                                    unsubscribe={this.props.unsubscribeCampaignToFbIntegration}
          />
          <ModalOptinFormIntegration/>
          <CampaignModal
            companyId={this.state.companyId}
            dealId={this.state.dealId}
            agentId={this.state.agentId}/>
          <Confirm open={this.state.open} onCancel={this.openConfirmModal.bind(this, false)}
                   onConfirm={this.onConfirm}/>
            <div className="top note">
                When you change a campaign's company, your integrations will stop running until you assign them a new agent. <a className="item" href="https://convertlead.com/docs-home/" target="_blank">Learn more</a>
            </div>
            <Grid columns={2}>
            <Grid.Column>
                <Header floated='left' as='h1'>Integrations</Header>
              <Form.Field>
                <Checkbox label='Show Archived' toggle onChange={this.onShowArch}/>
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Menu secondary>
                <Menu.Menu position='right'>
                  <Link to={`/deals/${dealId}/automations`} >
                    <Button color='teal' content='Automations' labelPosition='left'/>
                  </Link>
                  <Button color='teal' content='New Integration' onClick={this.props.loadForm.bind(this, {
                    agentId: this.state.agentId,
                    show: true
                  })}  labelPosition='left'/>
                </Menu.Menu>
              </Menu>
            </Grid.Column>
          </Grid>
           <Segment basic>
              <Loader/>
            <Table singleLine>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>#</Table.HeaderCell>
                  <Table.HeaderCell>Name
                    <Icon name={this.getSort('name')}
                          onClick={this.props.sort.bind(this, 'name')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Type
                    <Icon name={this.getSort('type')}
                          onClick={this.props.sort.bind(this, 'type')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Leads <Icon name={this.getSort('leads')}
                                                onClick={this.props.sort.bind(this, 'leads')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Assigned to</Table.HeaderCell>
                  {
                    this.state.agentId && Auth.isAgency ?
                      <Table.HeaderCell>Company</Table.HeaderCell> : null
                  }
                  <Table.HeaderCell> Avg Response time
                    <Icon name={this.getSort('avg_time_response')}
                          onClick={this.props.sort.bind(this, 'avg_time_response')}/>
                  </Table.HeaderCell>
                  <Table.HeaderCell>Edit/Access/Archive</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {
                  campaigns.map((campaign, index) => (
                    <Table.Row key={index}>
                      <Table.Cell>
                        {
                          campaign.integration === 'FACEBOOK'
                            ? <Button circular className='facebookbut' icon='facebook'/>
                            : null
                        }
                        {
                          campaign.integration === 'ZAPIER'
                            ? <Button circular className='zapierbut'
                                      icon='icon-zapier'/>
                            : null
                        }
                        {
                          campaign.integration === 'CLICKFUNNELS'
                            ? <Button circular className='clickfunnelsbut'
                                      icon='icon-clickfunnels'>

                            </Button>
                            : null
                        }
                        {
                          campaign.integration === 'WEBHOOK'
                            ? <Button circular className='webhookbut'
                                      icon='icon-webhook'/>
                            : null
                        }
                        {
                          campaign.integration === 'INSTAPAGE'
                            ? <Button circular className='instapagebut'
                                      icon='icon-instapage'/>
                            : null
                        }
                        {
                          campaign.integration === 'UNBOUNCE'
                            ? <Button circular className='unbouncedbut'
                                      icon='icon-unbounce'/>
                            : null
                        }
                        {
                          campaign.integration === 'OPTIN_FORM'
                            ? <Button circular color='purplegray' icon='file alternate outline'/>
                            : null
                        }
                      </Table.Cell>
                      <Table.Cell>{campaign.name}</Table.Cell>
                      <Table.Cell>{campaign.integration}</Table.Cell>
                      <Table.Cell>
                        <Link to={`/companies/${campaign.company.id}/campaigns/${campaign.id}/leads`}>{campaign.leads_count || 0}</Link>
                      </Table.Cell>
                      <Table.Cell>
                        {
                          campaign.agents && campaign.agents.map((agent, key) =>
                            <div key={key}><Link to={`/agents/${agent.id}/profile`}>{agent.name}</Link></div>
                          )
                        }
                      </Table.Cell>
                      {
                        this.state.agentId && Auth.isAgency ? <Table.Cell>
                          <Link
                            to={`/companies/${campaign.company.id}/profile`}>{campaign.company.name}</Link>
                        </Table.Cell> : null
                      }
                      <Table.Cell>{campaign.avg_time_response || 0}</Table.Cell>
                      <Table.Cell>
                        {
                          !campaign.deleted_at ?
                            (<div className="action-button">
                              <Button
                                className={"integration-but"}
                                onClick={this.loadIntegrationForm.bind(this, campaign)}>
                                Integration
                              </Button>
                              <ButtonGroup>
                                <Button onClick={this.props.loadForm.bind(this, {
                                  ...campaign,
                                  companyId: campaign.company_id,
                                  dealId: campaign.deal_id,
                                  agentId: this.state.agentId,
                                  agents: campaign.agents && campaign.agents.map(agent => agent.id),
                                  show: true
                                })}>
                                  Edit
                                </Button>
                                <Button
                                  onClick={this.openConfirmModal.bind(this, true, campaign.id)}>
                                  Archive
                                </Button>
                              </ButtonGroup>
                            </div>)
                            : null
                        }
                      </Table.Cell>
                    </Table.Row>
                  ))
                }

              </Table.Body>
            </Table>
          </Segment>
        </Segment>
        <Segment textAlign='right' attached='bottom'>
          <Pagination onPageChange={this.gotoPage}
                      defaultActivePage={pagination.current_page}
                      prevItem={null}
                      nextItem={null}
                      totalPages={pagination.last_page}/>
        </Segment>

      </div>
    );
  }
}

export default compose(OptinFormIntegrationContainer, MessagesContainer, ProfileContainer, AgentsContainer, CampaignsContainer, CampaignFormContainer, BreadCrumbContainer)(Campaigns);
