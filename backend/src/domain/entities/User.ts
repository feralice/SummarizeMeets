export interface UserProps {
  id?: string;
  name: string;
  email: string;
  password: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  toJSON() {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
}
