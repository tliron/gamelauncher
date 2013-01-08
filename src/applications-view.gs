[indent=4]

uses
    Gtk

namespace GameLauncher

    enum private Column
        LAUNCHER = 0                 // Launcher
        ICON = 1                     // Pixbuf
        NAME = 2                     // string
        GAMING_DESKTOP_PERMANENT = 3 // bool

    class ApplicationsView: Frame
        construct(window: MainWindow, title: string)
            _window = window
            _store = new TreeStore(4, typeof(Launcher), typeof(Gdk.Pixbuf), typeof(string), typeof(bool))

            var icon_renderer = new CellRendererPixbuf()
            var name_renderer = new CellRendererText()
            name_renderer.ellipsize = Pango.EllipsizeMode.END
            name_renderer.mode = CellRendererMode.ACTIVATABLE // Allows the CellRendererToggle to work
            var gaming_desktop_permanent_renderer = new CellRendererToggle()
            gaming_desktop_permanent_renderer.toggled.connect(on_gaming_desktop_permanent_toggled)

            var column = new TreeViewColumn()
            
            column.pack_start(icon_renderer, false)
            column.pack_start(name_renderer, true)
            column.pack_start(gaming_desktop_permanent_renderer, false)

            column.add_attribute(icon_renderer, "pixbuf", Column.ICON)
            column.add_attribute(name_renderer, "markup", Column.NAME)
            column.add_attribute(gaming_desktop_permanent_renderer, "active", Column.GAMING_DESKTOP_PERMANENT)

            _view = new TreeView.with_model(_store)
            _view.headers_visible = false
            _view.append_column(column)
            _view.button_press_event.connect(on_pressed)
            var tree_scrolled = new ScrolledWindow(null, null)
            tree_scrolled.add(_view)
            var box = new Box(Orientation.VERTICAL, 10)
            var label = new Label("<b>%s</b>".printf(title))
            label.use_markup = true
            box.pack_start(label, false)
            box.pack_start(tree_scrolled)
            add(box)
            shadow_type = ShadowType.NONE
        
        def update(launchers: list of Launcher)
            _store.clear()
            for var launcher in launchers
                iter: TreeIter
                _store.append(out iter, null)
                _store.@set(iter, Column.LAUNCHER, launcher, Column.ICON, fetch_icon(launcher.icon), Column.NAME, Markup.escape_text(launcher.name), Column.GAMING_DESKTOP_PERMANENT, launcher.gaming_desktop_enabled, -1)

        def get_selected_launcher(): Launcher?
            var selection = _view.get_selection()
            var tree_paths = selection.get_selected_rows(null)
            if tree_paths.length() > 0
                iter: TreeIter
                if _store.get_iter(out iter, tree_paths.data)
                    value: Value
                    _store.get_value(iter, Column.LAUNCHER, out value)
                    return (Launcher) value
            return null

        def private on_pressed(e: Gdk.EventButton): bool
            if e.type == Gdk.EventType.@2BUTTON_PRESS
                var launcher = get_selected_launcher()
                if launcher is not null
                    launcher.gaming_desktop_enabled = true
                    var exec = launcher.exec
                    if exec is not null
                        try
                            Process.spawn_command_line_async(exec)
                        except e: SpawnError
                            _window.on_error(e, "Could not launch \"%s\"!".printf(launcher.name))
                    return true
            return false
        
        def private on_gaming_desktop_permanent_toggled(path: string)
            iter: TreeIter
            if _store.get_iter(out iter, new TreePath.from_string(path))
                value: Value
                _store.get_value(iter, Column.GAMING_DESKTOP_PERMANENT, out value)
                var gaming_desktop_permanent = not (bool) value
                _store.get_value(iter, Column.LAUNCHER, out value)
                var launcher = (Launcher) value
                if launcher.gaming_desktop_enabled != gaming_desktop_permanent
                    launcher.gaming_desktop_enabled = gaming_desktop_permanent
                    try
                        launcher.save()
                        _store.set_value(iter, Column.GAMING_DESKTOP_PERMANENT, gaming_desktop_permanent)
                        _window.update()
                    except e: Error
                        _window.on_error(e, "Could not modify launcher!")

        _window: MainWindow
        _store: TreeStore
        _view: TreeView
