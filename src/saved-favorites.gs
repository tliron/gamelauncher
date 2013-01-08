[indent=4]

namespace GameLauncher

    class SavedFavorites: LinesFile
        construct() raises Error
            super("%s/.gamelauncher/favorites.config".printf(Environment.get_home_dir()))
