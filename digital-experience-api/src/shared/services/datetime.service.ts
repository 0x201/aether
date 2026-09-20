import { Injectable } from "@nestjs/common"
import moment from "moment"

@Injectable()
export class DateTimeService {
  getNowString(format: string = "YYYY-MM-DD HH:mm:ss", utcTime: boolean = false): string {
    let now = moment()
    if (utcTime) {
      now = now.utc()
    }
    return now.format(format)
  }
}
