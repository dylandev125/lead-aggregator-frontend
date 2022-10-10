import React from 'react';
import * as moment from 'moment';
import { DATE_FORMAT } from '@constants';

export const TimeLineRecord = ({ note }) => (
  <li className='timeline-record'>
    <div className='timeline-record-text-preview'>
      <label className='creation-date'>{moment.utc(note.created_at).local().format(DATE_FORMAT)}</label>
      <label className='creation-time'>{moment.utc(note.created_at).local().format('LT')}</label>
      <div className='timeline-text'>{note.agent.name}, {note.message}</div>
      {
        note.recordingUrl && (
          <audio controls>
            <source src={note.recordingUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )
      }
    </div>
  </li>
);
