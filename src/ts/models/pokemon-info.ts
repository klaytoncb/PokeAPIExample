export default interface PokemonInfo {

    id: number;

    abilities: {

        ability: {

            name: string;
        }
    }[];

    moves: {

        move: {

            name: string;
        };
    }[];

    name: string;

    sprites: {

        front_default: string;

        versions: {

            "generation-vii": {

                icons: {

                    front_default: string
                }
            }
        }
    };

    stats: {

        base_stat: number;
        stat: {

            name: string;
        }
    }[];

    types: {

        type: {
            
            name: string;
        }
    };

    weight: number;
}