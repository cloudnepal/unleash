import {
    CommandResultGroup,
    RecentlyVisitedFeatureButton,
    RecentlyVisitedPathButton,
    RecentlyVisitedProjectButton,
} from './RecentlyVisited/CommandResultGroup';
import { List } from '@mui/material';
import {
    useRecentlyVisited,
    type LastViewedPage,
} from 'hooks/useRecentlyVisited';

const toListItemButton = (
    item: LastViewedPage,
    routes: Record<string, { path: string; route: string; title: string }>,
    index: number,
) => {
    const key = `recently-visited-${index}`;
    if (item.featureId && item.projectId) {
        return (
            <RecentlyVisitedFeatureButton
                key={key}
                featureId={item.featureId}
                projectId={item.projectId}
            />
        );
    }
    if (item.projectId) {
        return (
            <RecentlyVisitedProjectButton
                key={key}
                projectId={item.projectId}
            />
        );
    }
    if (!item.pathName) return null;
    const name = routes[item.pathName]?.title ?? item.pathName;
    return (
        <RecentlyVisitedPathButton key={key} path={item.pathName} name={name} />
    );
};

export const CommandRecent = ({
    routes,
}: {
    routes: Record<string, { path: string; route: string; title: string }>;
}) => {
    const { lastVisited } = useRecentlyVisited();
    const buttons = lastVisited.map((item, index) =>
        toListItemButton(item, routes, index),
    );
    return (
        <CommandResultGroup icon='default' groupName='Quick suggestions'>
            <List>{buttons}</List>
        </CommandResultGroup>
    );
};
