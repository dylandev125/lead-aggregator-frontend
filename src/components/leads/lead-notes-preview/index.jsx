import React, {Component} from 'react';
import {compose} from 'recompose';
import {Segment, Button, Grid, Icon} from 'semantic-ui-react';
import { BreadCrumbContainer, LeadNotesContainer, LeadFormContainer, LeadsContainer } from "@containers";
import TimeLine from "./timeline";
import './index.scss';
import LeadModal from 'components/@common/modals/lead';
import {Link} from "react-router-dom";
import { Device } from 'twilio-client';

class LeadNotes extends Component {
    state = {
        onPhone: false,
        readyToCall: false,
    }
    async componentWillMount() {
        const {companyId, leadId} = this.props;
        this.props.loadLead(companyId, leadId, true, true);
        this.props.fetchTwilioTokenBy(leadId);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.leadId !== this.props.leadId) {
            const {companyId, leadId} = this.props;
            this.props.loadLead(companyId, leadId, true, true);
        }
        if (prevProps.twilioToken !== this.props.twilioToken && this.props.twilioToken) {
            Device.setup(this.props.twilioToken);
        }
    }

    componentDidMount() {
        Device.disconnect(() => {
            this.setState({
                onPhone: false,
            });
        });
        Device.ready(() => {
            console.log('Redy to call');
            this.setState({
                ...this.state,
                readyToCall: true,
            })
        });
    }

    onAddNote = form => {
        this.props.createLeadNote({
            ...form,
            status: form.status ? form.status : this.props.lead.status
        });
    };

    onCall = () => {
        const checkIsValidNumber = /^([0-9]|#|\*)+$/.test(this.props.lead.phone.replace(/[\+\-()\s]/g,''))
        if (this.state.onPhone) {
            Device.disconnectAll();
        } else if (this.props.twilioToken && checkIsValidNumber) {
            Device.connect({ number: this.props.lead.phone });
            this.setState({
                onPhone: true,
            });
        }
    }

    render() {
        const {lead, leadNotes, leadStatuses, twilioToken} = this.props;
        const { onPhone } = this.state;
        return (
            <div className='LeadNotesPreview'>
                <LeadModal size='small'/>
                <Grid.Column width={6}>
                    <Segment className='lead-profile'>
                        <div className="leadprofile-top">Quick Preview <Link to={`/companies/${lead.company_id}/leads/${lead.id}/notes`}>
                            <Button color="teal">Profile</Button>
                        </Link>
                        <div className="onClosePreview">
                            <Icon className="flaticon stroke x-2" onClick={() => this.props.onClose()} />
                        </div></div>
                        <div className='lead-profile-row'>
                            <div className='lead-profile-value fullname'>{lead.fullname}</div>

                            {
                                !lead.deleted_at && (
                                  <Grid.Column  style={{textAlign: 'center'}}>
                                      <div className={'ui secondary menu leadnotes'}>
                                          <Button circular className='email'
                                                  icon='icon-email'   as='a' href={`mailto:${lead.email}`}/>

                                          <Button circular className='editlead'
                                                  icon='icon-pencil'  onClick={this.props.loadForm.bind(this, {
                                              ...lead,
                                              company_id: lead.company.id,
                                              show: true
                                          })}/>
                                          {
                                              twilioToken && <Button circular className={(onPhone ? 'endCall' : 'onCall')} icon='phone'  onClick={this.onCall} />
                                          }
                                      </div>
                                  </Grid.Column>
                                )
                            }

                             <div className='lead-profile-row'>
                            <div className='lead-profile-label'><label>Phone</label></div>
                            <div className='lead-profile-value'>{lead.phone}</div>
                        </div>
                        <div className='lead-profile-row'>
                            <div className='lead-profile-label'><label>Email</label></div>
                            <div className='lead-profile-value'>{lead.email}</div>
                        </div>
                         <div className='lead-profile-row'>
                            <div className='lead-profile-label'><label>Integration</label></div>
                            <div className='lead-profile-value'>{lead.campaign.name}</div>
                        </div>
                        <div className='lead-profile-row'>
                            <div className='lead-profile-label'><label>Assigned to</label></div>
                            <div className='lead-profile-value'>{lead.agent.name}</div>
                        </div>
                        <div className='lead-profile-row'>
                            <div className='lead-profile-label'><label>Company</label></div>
                            <div className='lead-profile-value'>{lead.company.name}</div>
                        </div>
                        <div className='lead-profile-row additionalinfo'>
                            <div className='lead-profile-label-additional '><label>Additional information:</label></div>

                        </div>
                        <TimeLine notes={leadNotes} lead={lead} onAddNote={this.onAddNote}
                                  leadStatuses={leadStatuses}/>
                        </div>
                    </Segment>
                </Grid.Column>
            </div>
        )
    }
}

export default compose(BreadCrumbContainer, LeadsContainer, LeadNotesContainer, LeadFormContainer)(LeadNotes);
