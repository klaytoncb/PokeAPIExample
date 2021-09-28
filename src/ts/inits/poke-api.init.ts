import angular from "angular";
import PokeApiConfig from "../configs/poke-api.config";
import PokemonInfo from "../models/pokemon-info";

export default class PokeApiInit {

  protected moduleName: string;
  protected modules: string[];

  constructor() {

    this.moduleName = "AgendamentoVisitaFormApp";
    this.modules = ["infinite-scroll"];
  }

  async init() {

    let module: ng.IModule;

    module = angular.module(this.moduleName, this.modules);

    module.config(["$locationProvider", "$compileProvider", ($locationProvider: ng.ILocationProvider, $compileProvider: ng.ICompileProvider) => {

      $locationProvider.html5Mode({

        enabled: true,
        requireBase: false
      });

      if (process.env.NODE_ENV == "production") {

        $compileProvider.debugInfoEnabled(false);
      }

      $compileProvider.commentDirectivesEnabled(false);
      $compileProvider.cssClassDirectivesEnabled(false);
    }]);

    PokeApiConfig.register(module);

    angular.bootstrap(document, [this.moduleName], { strictDi: true });

    return module;
  }
}

angular.element(() => {

  new PokeApiInit().init();
});