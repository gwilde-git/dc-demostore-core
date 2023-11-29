import React, { FC } from 'react'
import { ImageStatistics } from './ImageStatistics';
import { Theme, Tooltip } from '@mui/material';
import { WithStyles, withStyles } from '@mui/styles';

const styles = (theme: Theme) => ({
  container: {
    width: '100%',
    height: '24px',
    display: 'flex'
  },
  barBase: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    height: '24px',
    outline: '2px solid white',
    overflow: 'hidden',
    fontSize: '12px'
  }
});

const colors: { [key: string]: string } = {
  jpeg: '#FFA200',
  webp: '#00B6FF',
  avif: '#65CC02',
  auto: '#8F9496',
  png: '#E94420'
}

interface Props extends WithStyles<typeof styles> {
  stat: ImageStatistics;
}

function getOrderedFormats(stat: ImageStatistics): {key: string, size: number, same: string[]}[] {
    // Formats ordered by size.
    const formatSizes = Object.keys(stat.sizes).map(key => ({key, size: stat.sizes[key], same: [key]}));

    formatSizes.sort((a, b) => a.size - b.size);

    for (let i = 0; i < formatSizes.length; i++) {
      for (let j = 0; j < i; j++) {
        if (formatSizes[i].size == formatSizes[j].size) {
          formatSizes[i].same.push(formatSizes[j].key);
          formatSizes[j].same.push(formatSizes[i].key);
        }
      }
    }

    return formatSizes;
}

const ImageStatisticsStack: FC<Props> = ({stat, classes}) => {
    const ordered = getOrderedFormats(stat);
    const maxSize = ordered[ordered.length - 1].size;
    const maxKey = ordered[ordered.length - 1].key;

    return <div className={classes.container}>
        {
          ordered.map((elem, index) => {
            const size = elem.size;
            const lastSize = index === 0 ? 0 : ordered[index - 1].size;
            const name = elem.same.join('/');

            return <Tooltip key={elem.key} title={`${name}: ${elem.size} bytes (${Math.round(1000 * elem.size / maxSize) / 10}% of ${maxKey})`}>
              <div className={classes.barBase} style={{backgroundColor: colors[elem.key], width: `${((size - lastSize) / maxSize) * 100}%` }}>
                {name}
              </div>
            </Tooltip>
          })
        }
    </div>
}

export default withStyles(styles)(ImageStatisticsStack);
