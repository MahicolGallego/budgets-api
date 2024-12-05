import { alert_message } from '../constants/enums/alert-message.enum';
import { alert_type } from '../constants/enums/alert-type.enum';

export interface IAlertMessage {
  alert_type: alert_type;
  budget_name: string;
  message: alert_message;
}
