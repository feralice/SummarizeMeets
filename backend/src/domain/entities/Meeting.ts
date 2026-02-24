export interface MeetingProps {
  id?: string;
  meetingTitle: string;
  meetingDate: Date;
  summary: any;
  topics: any[];
  decisions: string[];
  actionItems: any[];
  speakers: any[];
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

  toJSON() {
    return {
      id: this.props.id,
      meetingTitle: this.props.meetingTitle,
      meetingDate: this.props.meetingDate,
      summary: this.props.summary,
      topics: this.props.topics,
      decisions: this.props.decisions,
      actionItems: this.props.actionItems,
      speakers: this.props.speakers,
      status: this.props.status,
      userId: this.props.userId,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
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

  get summary(): any {
    return this.props.summary;
  }

  get topics(): any[] {
    return this.props.topics;
  }

  get decisions(): string[] {
    return this.props.decisions;
  }

  get actionItems(): any[] {
    return this.props.actionItems;
  }

  get speakers(): any[] {
    return this.props.speakers;
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
