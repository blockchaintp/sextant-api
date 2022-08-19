import ConfigController from './config'
import UserController from './user'
import ClusterController from './cluster'
import DeploymentController from './deployment'
import DamlController from './daml'
import TaekionController from './taekion'
import AdministrationController from './administration'
import { StoreType } from '../store'

const Controllers = ({ store, settings }: { store: StoreType; settings: any }) => {
  const config = ConfigController()

  const user = UserController({
    store,
    settings,
  })

  const cluster = ClusterController({
    store,
  })

  const deployment = DeploymentController({
    store,
  })

  const daml = DamlController({
    store,
  })

  const taekion = TaekionController({
    store,
  })

  const administration = AdministrationController()

  return {
    config,
    user,
    cluster,
    deployment,
    daml,
    taekion,
    administration,
  }
}

export default Controllers
