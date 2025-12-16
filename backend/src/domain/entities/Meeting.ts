export interface MeetingProps {
  id?: string;
  meetingTitle: string;
  meetingDate: Date;
  summary: string;
  actionPoints: string;
  notes?: string;
  status: string;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Meeting {
  private props: MeetingProps;

  constructor(props: MeetingProps) {
    this.props = {
      ...props,
      status: props.status || 'pending',
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get meetingTitle(): string {
    return this.props.meetingTitle;
  }

  get meetingDate(): Date {
    return this.props.meetingDate;
  }

  get summary(): string {
    return this.props.summary;
  }

  get actionPoints(): string {
    return this.props.actionPoints;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get status(): string {
    return this.props.status;
  }

  get userId(): string {
    return this.props.userId;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
}
