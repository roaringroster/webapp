# Build for testing and production

## Usage

You can build the app, optionally change it's semantic version string or upload it to a location of your choice in one command, either for testing or for distributing the app:

```bash
npm run build <product> [publish=<channel>] [version=<version>]
```

The required `product` argument defines the target platform and can be any of the following values:

* `web`: web app
* `ios`
* `android`
* `cordova`: shortcut to build `ios` and `android` with one command
* `mac`
* `win`
* `electron`: shortcut to build `mac` and `windows`
* `system`: build an electron app, but for your development machine's operating system and architecture only
* `app`: shortcut to build `mac`, `windows`, `ios` and `android`

The optional `publish` argument indicates that the build results are uploaded using the commands and information defined in environment variables. It's channel value defines the location from where the build results can be downloaded. The value can be custom, but it is more likely to use one of the predefined ones for the most common scenarios:

* `dev`: where you download your build results for internal testing
* `beta`: where you distribute your beta builds to your testers
* `release`: where your official releases can be publicly downloaded

The `version` argument changes the app's semantic version string (e.g. 1.0.3). It is required when `publish=beta` or `publish=release` and otherwise optional. The value can either be a specific semantic version string (e.g. `2.0.1`), or `patch`, `minor` or `major` to automatically increment the hereby specified part of the semantic version string.

## Examples

Quickly build the app for your development machine's operating system and architecture to try it locally:

```bash
npm run build system
```

Increment the app version, build the app for all platforms and distribute it to your beta testers, using TestFlight for iOS:

```bash
npm run build app publish=beta version=patch
```

## Testing

To build an electron production build fast with enabled DevTools and process.env.DEBUGGING evaluating to true and without code signing, notarization and multiple architectures, but not in dev mode:

```bash
QENV=production FAST_BUILD=true CSC_IDENTITY_AUTO_DISCOVERY=false quasar build --debug -m electron
```

To build an electron production build fast (without code signing, notarization and multiple architectures), but not for debugging:

```bash
FAST_BUILD=true CSC_IDENTITY_AUTO_DISCOVERY=false quasar build -m electron
```

## System Requirements

Windows 10
macOS 11 (Big Sur)
iOS 14.8
Android 10

MacOS 10.15 (Catalina) would still be possible when downgrading to electron version 32.
Minimum electron version is 28 because of ESM support. That's why macOS 10.13 and 10.14 are no longer possible that were supported by electron version 26.
