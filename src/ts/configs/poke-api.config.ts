import PokeApiController from "../controllers/poke-api.controller";

export default class PokeApiConfig {

    bindings?: { [boundProperty: string]: string };
    controller: ng.Injectable<ng.IControllerConstructor>;
    controllerAs: string;
    template?: string;
    componentName: string;

    constructor() {
  
      this.componentName = "pokeApi";
      this.controller = PokeApiController;
      this.controllerAs = "$poke";
      this.template = require("../views/poke-api.html");
    }

      /**
  * realiza o registro do componente
  * @param module módulo no qual será registrado o componente
  * @param components componentes a serem registrados
  */
  static register(module: ng.IModule) {

      const instance = new PokeApiConfig();

      module.component(instance.componentName, instance);
  }
}