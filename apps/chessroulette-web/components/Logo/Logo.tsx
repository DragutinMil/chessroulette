import React, { CSSProperties, useMemo } from 'react';
// import { createUseStyles, CSSProperties } from 'src/lib/jss';
import logoLight from './assets/Logo_light_full.svg';
import logoDark from './assets/Logo_dark_full.svg';
import logoDarkWithBeta from './assets/Logo_dark_full_w_beta.svg';
import logoLightSingle from './assets/Logo_light_single.svg';
import logoDarkSingle from './assets/Logo_dark_single.svg';
import logoLightWithBeta from './assets/light_with_beta.svg';
import logoDarkSingleStroke from './assets/Logo_dark_single_stroke_variation.svg';
import Image from 'next/image';
// import { onlyMobile } from 'src/theme';
// import cx from 'classnames';
// import { Link } from 'react-router-dom';
// import { useColorTheme } from 'src/theme/hooks/useColorTheme';

type Props = {
  asLink?: boolean;
  darkBG?: boolean;
  withBeta?: boolean;
  withOutline?: boolean;
  mini?: boolean;
  className?: string;
  imgClassName?: string;
  width?: string;
  style?: CSSProperties;
};

export const Logo: React.FC<Props> = ({
  asLink = true,
  withBeta = false,
  mini = false,
  darkBG = false,
  withOutline = false,
  className,
  imgClassName,
  style,
}) => {
  // const imgSrc = useMemo(() => {
  //   if (mini) {
  //     if (!darkBG && withOutline) {
  //       return logoDarkSingleStroke;
  //     }

  //     return darkBG ? logoLightSingle : logoDarkSingle;
  //   }
  // }, [darkBG, mini, withOutline, logoDarkSingleStroke, logoDarkSingle, logoLightSingle]);

  // console.log('imgSrc', imgSrc);

  //   if (darkBG || theme.name === 'darkDefault') {
  //     if (withBeta) {
  //       return logoLightWithBeta;
  //     }
  //     return logoLight;
  //   }

  //   if (theme.name === 'lightDefault') {
  //     if (withBeta) {
  //       return logoDarkWithBeta;
  //     }
  //     return logoDark;
  //   }

  //   return darkBG ? logoLight : logoDark;
  // }, [mini, darkBG, withOutline, theme]);

  return (
    <div className="" style={style}>
      <Image
        src={logoLight}
        alt="Chessroulette Logo"
        width={220}
        // height={500}
      />
    </div>
  );

  // return asLink ? <Link to="/">{content}</Link> : content;
};

// const useStyles = createUseStyles({
//   container: {
//     position: 'relative',
//     display: 'block',
//     width: '220px',

//     ...onlyMobile({
//       width: '100%',
//       maxWidth: '170px',
//       //minWidth: '100px',
//     }),
//   },
//   miniContainer: {
//     width: '50px',
//   },
//   img: {
//     width: '100%',
//   },
// });
