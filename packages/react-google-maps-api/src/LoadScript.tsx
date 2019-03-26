import * as React from "react"

import { injectScript } from "./utils/injectscript"
import { preventGoogleFonts } from "./utils/prevent-google-fonts"

import { isBrowser } from "./utils/isbrowser"

let cleaningUp = false

interface LoadScriptState {
  loaded: boolean;
}

interface LoadScriptProps {
  // required
  id: string;

  // required
  googleMapsApiKey: string;

  // required
  language: string;

  // required
  region: string;

  // required
  version: string;
  loadingElement?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onUnmount?: () => void;
  libraries: string[];
  preventGoogleFontsLoading?: boolean;
}

const DefaultLoadingElement = () => (
  <div>{`Loading...`}</div>
)

class LoadScript extends React.PureComponent<LoadScriptProps, LoadScriptState> {
  public static defaultProps = {
    libraries: [] // Do not remove!,
  }

  check: React.RefObject<HTMLDivElement> = React.createRef()

  state = {
    loaded: false
  }

  // eslint-disable-next-line @getify/proper-arrows/this, @getify/proper-arrows/name
  cleanupCallback = () => {
    //@ts-ignore
    delete window.google

    this.injectScript()
  }

  componentDidMount() {
    if (isBrowser) {
      // @ts-ignore
      if (window.google && !cleaningUp) {
        console.error("google api is already presented")
        return
      }

      this.isCleaningUp().then(this.injectScript)
    }
  }

  componentDidUpdate(prevProps: LoadScriptProps) {
    if (this.props.libraries !== prevProps.libraries) {
      console.warn('Performance warning! Loadscript has been reloaded unintentionally! You should not pass `libraries` prop as new array. Please keep an array of libraries as static class property for Components and PureComponents, or just a const variable ounside of component, or somwhere in config files or ENV variables')
    }

    if (
      isBrowser &&
      prevProps.language !== this.props.language
    ) {
      this.cleanup()
      // TODO: refactor to use gDSFP maybe... wait for hooks refactoring.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState(
        function setLoaded() {
          return {
            loaded: false
          }
        },
        this.cleanupCallback
      )
    }
  }

  componentWillUnmount() {
    if (isBrowser) {
      this.cleanup()

      // eslint-disable-next-line @getify/proper-arrows/this
      const timeoutCallback = () => {
        if (!this.check.current) {
          //@ts-ignore
          delete window.google
          cleaningUp = false
        }
      }

      setTimeout(timeoutCallback, 1)

      this.props.onUnmount()
    }
  }

  // eslint-disable-next-line @getify/proper-arrows/name
  isCleaningUp = async () => {
    function promiseCallback (resolve) {
      if (!cleaningUp) {
        resolve()
      } else {
        if (isBrowser) {
          const timer = window.setInterval(
            function interval() {
              if (!cleaningUp) {
                window.clearInterval(timer)

                resolve()
              }
            },
            1
          )
        }
      }
    }

    return new Promise(promiseCallback)
  }

  // eslint-disable-next-line @getify/proper-arrows/this, @getify/proper-arrows/name
  cleanup = () => {
    cleaningUp = true
    const script = document.getElementById(this.props.id)

    if (script && script.parentNode) {
      script.parentNode.removeChild(script)
    }

    Array.prototype.slice
      .call(document.getElementsByTagName("script"))
      .filter(function filter (script: HTMLScriptElement) {
        return script.src.includes("maps.googleapis")
      })
      .forEach(function forEach (script: HTMLScriptElement) {
        if (script.parentNode) {
          script.parentNode.removeChild(script)
        }
      })

    Array.prototype.slice
      .call(document.getElementsByTagName("link"))
      .filter(function filter (link: HTMLLinkElement) {
        link.href ===
        "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700|Google+Sans"
      })
      .forEach(function forEach (link: HTMLLinkElement) {
        if (link.parentNode) {
          link.parentNode.removeChild(link)
        }
      })

    Array.prototype.slice
      .call(document.getElementsByTagName("style"))
      .filter(function filter (style: HTMLStyleElement) {
        return style.innerText.includes(".gm-")
      })
      .forEach(function forEach (style: HTMLStyleElement) {
        if (style.parentNode) {
          style.parentNode.removeChild(style)
        }
      })
  }

  // eslint-disable-next-line @getify/proper-arrows/this, @getify/proper-arrows/name
  injectScript = () => {
    if (this.props.preventGoogleFontsLoading) {
      preventGoogleFonts()
    }

    const injectScriptOptions = {
      id: this.props.id,
      url: `https://maps.googleapis.com/maps/api/js?v=${this.props.version}&key=${this.props.googleMapsApiKey}&language=${this.props.language}&region=${this.props.region}${
        this.props.libraries ? `&libraries=${this.props.libraries.join(",")}` : ""
      }`
    }

    injectScript(injectScriptOptions)
      // eslint-disable-next-line @getify/proper-arrows/this, @getify/proper-arrows/name
      .then(() => {
        this.props.onLoad()

        this.setState(function setLoaded () {
          return {
            loaded: true
          }
        })
      })
      // eslint-disable-next-line @getify/proper-arrows/this, @getify/proper-arrows/name
      .catch(err => {
        this.props.onError(err)

        console.error(`
          There has been an Error with loading Google Maps API script, please check that you provided all required props to <LoadScript />
          Props you have provided:
          googleMapsApiKey: ${this.props.googleMapsApiKey}
          language: ${this.props.language}
          region: ${this.props.region}
          version: ${this.props.version}
          libraries: ${(this.props.libraries || []).join(",")}
          Otherwise it is a Network issues.
        `)
      })
  }

  render() {
    return (
      <div ref={this.check}>
        {
          this.state.loaded
            ? this.props.children
            : (this.props.loadingElement || <DefaultLoadingElement />)
        }
      </div>
    )
  }
}

export default LoadScript
