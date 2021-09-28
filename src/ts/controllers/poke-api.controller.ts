import angular from "angular";
import bootstrap, { Modal } from "bootstrap";
import PokemonEndpoint from "../models/pokemon-endpoint.model";
import PokemonInfo from "../models/pokemon-info";

declare class Pokedex {

    static Pokedex: any;
}

export default class PokeApiController implements ng.IController {

    private readonly scope: ng.IScope;
    private readonly q: ng.IQService;

    private pokemonsIterator?: AsyncGenerator;

    private readonly pokemonsMap: { [name: string]: PokemonInfo };
    private pokemons: PokemonInfo[];
    private pokemonSelected?: PokemonInfo;

    private readonly search: { name?: string };

    private busy: boolean;
    private next?: () => void;
    private onFilterChange?: () => void;
    private showModal?: (pokemon: PokemonInfo) => void;

    static $inject = ["$scope", "$q"];

    constructor($scope: ng.IScope, $q: ng.IQService) {

        this.scope = $scope;
        this.q = $q;

        this.search = {};

        this.pokemonsMap = {};
        this.pokemons = [];
        this.busy = false;
    }

    async $onInit() {

        const controller = this;

        const p = new Pokedex.Pokedex({ cache:true });
        const pokemonsEndpoints: PokemonEndpoint[] = (await p.getPokemonsList()).results;

        const modalElement = document.getElementById("poke-modal");
        const modal = new bootstrap.Modal(modalElement || "");

        controller.pokemonsIterator = getPokemonIterator();
        next();

        controller.next = next;
        controller.onFilterChange = onFilterChange;
        controller.showModal = showModal;

        modalElement?.addEventListener("hidden.bs.modal", () => {
          
            controller.pokemonSelected = undefined;
            controller.scope.$applyAsync();
        })

        controller.scope.$applyAsync();

        async function* getPokemonIterator(substringName = "") {

            let pokemons: PokemonInfo[];

            try {
                
                const filteredPokemons = pokemonsEndpoints.filter(pokemon => pokemon.name.indexOf(substringName) > -1);

                let pokemonsChunk: PokemonEndpoint[];
                let unknownPokemons: PokemonEndpoint[];
                let pokemonsData: PokemonInfo[];

                do {

                    pokemonsChunk = filteredPokemons.splice(0, 20);

                    unknownPokemons = pokemonsChunk.filter(pokemon => !controller.pokemonsMap[pokemon.name]);

                    pokemonsData = await p.getPokemonByName(unknownPokemons.map(item => item.name));
                    pokemonsData.forEach(pokemonData => controller.pokemonsMap[pokemonData.name] = pokemonData);

                    pokemons = pokemonsChunk.map(pokemon => controller.pokemonsMap[pokemon.name]);

                    yield pokemons;

                } while (filteredPokemons.length);

            } catch (error) {

                console.log(error);
            }
        }

        async function next() {

            controller.busy = true;
            controller.scope.$applyAsync();

            const pokemons = await controller.pokemonsIterator?.next();

            controller.pokemons = pokemons?.value ? controller.pokemons.concat(pokemons.value): controller.pokemons;

            controller.busy = false;
            controller.scope.$applyAsync();
        }

        async function onFilterChange() {

            controller.pokemons = [];
            controller.pokemonsIterator = getPokemonIterator(controller.search?.name);
            await next();
        }

        function showModal(pokemon: PokemonInfo) {

            controller.pokemonSelected = pokemon;
            controller.scope.$applyAsync();
            
            modal.show();
        }
    }
}