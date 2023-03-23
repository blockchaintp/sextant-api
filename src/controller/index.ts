import { ConfigBackend } from './config'
import { UserController } from './user'
import { ClusterController } from './cluster'
import { DeploymentController } from './deployment'
import DamlController from './daml'
import { TaekionController } from './taekion'
import { AdministrationController } from './administration'
import { Store } from '../store'
import { Settings } from '../settings-singleton'

export class Controller {
  public administration: AdministrationController
  public cluster: ReturnType<typeof ClusterController>
  public config: ConfigBackend
  public daml: ReturnType<typeof DamlController>
  public deployment: ReturnType<typeof DeploymentController>
  public taekion: TaekionController
  public user: UserController

  constructor({ store, settings }: { settings: Settings; store: Store }) {
    this.config = new ConfigBackend()

    this.user = new UserController({
      store,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      settings,
    })

    this.cluster = ClusterController({
      store,
    })

    this.deployment = DeploymentController({
      store,
    })

    this.daml = DamlController({
      store,
    })

    this.taekion = new TaekionController({
      store,
    })

    this.administration = new AdministrationController()
  }
}
