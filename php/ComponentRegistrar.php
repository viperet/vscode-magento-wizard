<?php
namespace Magento\Framework\Component;

class ComponentRegistrar {
    const MODULE = 'module';
    const LIBRARY = 'library';
    const THEME = 'theme';
    const LANGUAGE = 'language';
    const SETUP = 'setup';

    private static $paths = [
        self::MODULE => [],
        self::LIBRARY => [],
        self::LANGUAGE => [],
        self::THEME => [],
        self::SETUP => []
    ];

    public static function register($type, $componentName, $path)
    {
        if (!isset(self::$paths[$type][$componentName])) {
            self::$paths[$type][$componentName] = str_replace('\\', '/', $path);
        }
    }

    public static function getPaths()
    {
        return \json_encode(self::$paths);
    }
}


try {
    include $argv[1];
    echo ComponentRegistrar::getPaths();
} catch (\Exception $e) {
    echo "false";
}