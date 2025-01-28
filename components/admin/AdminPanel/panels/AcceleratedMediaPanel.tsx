import React, { useState } from 'react';
import {
    Button,
    Checkbox,
    CircularProgress,
    FormControlLabel,
    IconButton,
    LinearProgress,
    Typography,
} from '@mui/material';
import ImageStatisticsModal from '../modals/ImageStatisticsModal';
import Modal from '@mui/material/Modal';
import ImageStatisticsGraph from '../ImageStatisticsGraph';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import { useAcceleratedMedia } from '../context/AcceleratedMediaContext';
import { DetermineImageSizes, ImageStatistics, hasInvalid } from '../ImageStatistics';
import { useRouter } from 'next/router';

function getProgress(stats: ImageStatistics[]): number {
    let completed = 0;
    let total = 0;

    for (const stat of stats) {
        completed += stat.completed;
        total += stat.total;
    }

    return 100 * (completed / total);
}

const VisibilityToggle = ({ selected, onClick }: any) => {
    return (
        <IconButton size="small" color={selected ? 'primary' : 'default'} onClick={onClick}>
            {selected && <CheckBoxIcon />}
            {!selected && <CheckBoxOutlineBlankIcon />}
        </IconButton>
    );
};

const AcceleratedMediaPanel = () => {
    const { asPath } = useRouter();

    const [calculating, setCalculating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [result, setResult] = useState<ImageStatistics[]>([]);
    const [resultPath, setResultPath] = useState<string>('!');
    const [excludeInvalid, setExcludeInvalid] = useState(true);

    const hasResult = resultPath === asPath;

    if (!hasResult && result.length > 0) {
        setResult([]);
    }

    const closeModal = () => {
        setModalOpen(false);
    };

    const openModal = () => {
        setModalOpen(true);
    };

    const startCalculating = async () => {
        setCalculating(true);
        await DetermineImageSizes((result) => {
            setResult([...result]);
            setResultPath(asPath);
        });
        setCalculating(false);
    };

    const { acceleratedMedia, setAcceleratedMedia } = useAcceleratedMedia();

    const toggleAcceleratedMedia = () => {
        setAcceleratedMedia(!acceleratedMedia);
    };

    const invalidImages = result.filter((stat) => hasInvalid(stat));

    return (
        <>
            <Table size="small" style={{ width: '100%' }}>
                <TableHead>
                    <TableRow>
                        <TableCell>Configuration</TableCell>
                        <TableCell align="right"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    <TableRow key={'content'}>
                        <TableCell>Enable Accelerated Media</TableCell>
                        <TableCell align="right">
                            <VisibilityToggle selected={acceleratedMedia} onClick={toggleAcceleratedMedia} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <form noValidate>
                <Button
                    style={{ marginTop: 12, marginBottom: 12 }}
                    startIcon={calculating && <CircularProgress size="1em" color="primary" />}
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={startCalculating}
                    disabled={calculating}
                >
                    Get Image Statistics
                </Button>
                <Modal open={modalOpen} onClose={closeModal}>
                    <div>
                        <ImageStatisticsModal stats={result} onClose={closeModal} />
                    </div>
                </Modal>
                {result.length == 0 && hasResult && (
                    <Typography component="p">No Amplience images detected.</Typography>
                )}
                {result.length > 0 && (
                    <>
                        <Typography component="p">
                            {result.length} Amplience image{result.length > 1 && 's'} detected.
                        </Typography>
                        <LinearProgress variant="determinate" value={getProgress(result)} />
                        {invalidImages.length > 0 && (
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={excludeInvalid}
                                        onChange={(event) => setExcludeInvalid(event.target.checked)}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    />
                                }
                                label={
                                    <Typography variant="caption">
                                        Exclude images that can&apos;t be accelerated ({invalidImages.length})
                                    </Typography>
                                }
                            />
                        )}
                        <ImageStatisticsGraph
                            stats={excludeInvalid ? result.filter((stat) => !hasInvalid(stat)) : result}
                        />
                        {!calculating && result.length > 0 && (
                            <>
                                <Button variant="outlined" color="primary" onClick={openModal} size="small">
                                    Open Details
                                </Button>
                            </>
                        )}
                    </>
                )}
            </form>
        </>
    );
};

export default AcceleratedMediaPanel;
