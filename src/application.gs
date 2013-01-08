[indent=4]

namespace GameLauncher

    class Application: Gtk.Application
        construct()
            Object(application_id: "gamelauncher.gtk", flags: ApplicationFlags.FLAGS_NONE)
        
        /*
         * This will always be called on the *primary* Application instance.
         */
        def override activate()
            if _window is null
                try
                    _window = new MainWindow(self)
                    _window.show_all()
                except e: Error
                    stderr.printf("%s\n", e.message)
            else
                _window.present()
        
        _window: MainWindow

init
    var application = new GameLauncher.Application()
    application.run(args)
