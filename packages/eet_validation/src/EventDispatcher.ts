import * as optimizely from '@optimizely/optimizely-sdk'
import cli from 'cli-ux'

const defaultEventDispatcher = require('@optimizely/optimizely-sdk/lib/plugins/event_dispatcher/index.node.js')

export class EventDispatcher implements optimizely.EventDispatcher {
  constructor(public logUrl: string | undefined) {}
  dispatchEvent(event: optimizely.Event, callback: () => void) {
    if (this.logUrl) {
      event.url = this.logUrl
    }
    cli.action.start('Dispatching event')
    cli.styledHeader('Event')
    cli.styledJSON(event)
    defaultEventDispatcher.dispatchEvent(event, (resp: any) => {
      callback()
      cli.action.stop()
      if (resp) {
        cli.styledHeader('Response')
        cli.styledObject(
          {
            status: resp.statusCode,
            headers: resp.headers
          },
          ['status', 'headers']
        )
      }
    })
  }
}
