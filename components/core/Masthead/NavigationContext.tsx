import { createContext, FC, useMemo, useContext } from "react";
import { CmsHierarchyNode } from "@lib/cms/fetchHierarchy";
import { CmsContent } from "@lib/cms/CmsContent";
import walkNavigation, { enrichCmsEntries, getTypeFromSchema } from "./walkNavigation";
import { useCmsContext } from "@lib/cms/CmsContext";
import { useUserContext } from "@lib/user/UserContext";

export type NavigationItem = {
    type: 'page' | 'external-page' | 'category' | 'group';
    title: string;
    href?: string;
    children: NavigationItem[];
    parents: NavigationItem[];

    content?: CmsContent;
    category?: any;
    
    nodeContentItem?: CmsContent;
};

export type NavigationState = {
    rootItems: NavigationItem[];
    findByHref: (href: string) => NavigationItem | undefined,
};

const NavigationContext = createContext<NavigationState | null>(null);

export const WithNavigationContext: FC<{
    pages: CmsHierarchyNode,
    categories: any
}> = ({ pages, categories, children }) => {

    // Retrieve locale/country code from context
    const { locale } = useCmsContext() || {}
    const { language } = useUserContext();

    // Flatten a hierarchy of children
    const flattenCategories = (categories: any[]) => {
        const allCategories: any[] = []
        const bulldozeCategories = (cat: any) => {
            allCategories.push(cat)
            cat.children && cat.children.forEach(bulldozeCategories)
        }
        categories.forEach(bulldozeCategories)
        return allCategories
    }

    // Merge together CMS + commerce categories into a single navigation structure
    const categoriesBySlug = useMemo(() => {
        const result: any = {};
        for (let item of flattenCategories(categories)) {
            result[item.slug] = item;
        }
        return result;
    }, [categories]);

    // Merge together CMS + commerce categories into a single navigation structure
    const categoriesById = useMemo(() => {
        const result: any = {};
        for (let item of flattenCategories(categories)) {
            result[item.id] = item;
        }
        return result;
    }, [categories]);

    const rootItems = useMemo(() => {

        const buildCategoryItem = (cmsCategory: CmsHierarchyNode | undefined, ecommerceCategory: any | undefined): NavigationItem | null => {
            if (!cmsCategory && !ecommerceCategory) {
                return null;
            }

            const children: NavigationItem[] = [];

            //const seoUrl = cmsCategory?.content?._meta?.deliveryKey ? cmsCategory?.content?._meta?.deliveryKey.split('/')[1] : `${ecommerceCategory?.slug}`

            const result = {
                type: 'category',
                title:  ecommerceCategory?.name,
                //href: cmsCategory?.content?._meta?.deliveryKey || ecommerceCategory?.slug?.en ? `/category/${ecommerceCategory?.slug?.en}` : null,
                // to use slug as URL, use next line
                href: cmsCategory?.content?._meta?.deliveryKey ? `/category/${cmsCategory?.content?._meta?.deliveryKey.split('/')[1]}` : `/category/${ecommerceCategory?.slug}`,
                //href: `/category/${ecommerceCategory?.slug}`,
                content: cmsCategory?.content,
                category: ecommerceCategory,
                children,
                nodeContentItem: cmsCategory?.content
            };

            // Add any content groups first
            const contentChildren = cmsCategory ? buildCmsEntries(cmsCategory.children) as NavigationItem[] : [];

            result.children = [
                ...contentChildren
            ];

            return result as NavigationItem;
        };

        const buildGroupItem = (node: CmsHierarchyNode): NavigationItem | null => {
            if (!node) {
                return null;
            }

            let title = node?.content?.title?.values?.find((item: any) => {
                return item.locale.startsWith(language);
            });
            if (!title) {
                title = node?.content?.title?.values?.find((item: any) => {
                    return item.locale.startsWith("en");
                }); 
            }

            return {
                type: 'group',
                title: title?.value,
                content: node?.content,
                children: buildCmsEntries(node.children),
                parents: []
            };
        };

        const buildPageItem = (node: CmsHierarchyNode): NavigationItem | null => {
            if (!node) {
                return null;
            }

            let title = node?.content?.title?.values?.find((item: any) => {
                return item.locale.startsWith(language);
            });
            if (!title) {
                title = node?.content?.title?.values?.find((item: any) => {
                    return item.locale.startsWith("en");
                }); 
            }

            return {
                type: 'page',
                title: title?.value,
                href: node.content._meta?.deliveryKey ? `/${node.content._meta?.deliveryKey}` : undefined,
                children: buildCmsEntries(node.children),
                parents: [],
                content: node.content,
                nodeContentItem: node.content
            };
        };

        const buildExternalPageItem = (node: CmsHierarchyNode): NavigationItem | null => {
            if (!node) {
                return null;
            }

            let title = node?.content?.title?.values?.find((item: any) => {
                return item.locale.startsWith(language);
            });
            if (!title) {
                title = node?.content?.title?.values?.find((item: any) => {
                    return item.locale.startsWith("en");
                }); 
            }

            return {
                type: 'external-page',
                title: title?.value,
                href: node.content.href,
                children: buildCmsEntries(node.children),
                parents: [],
                content: node?.content,
                nodeContentItem: node?.content
            };
        };
        
        const buildCmsItem = (node: CmsHierarchyNode): NavigationItem | null => {
            const type = getTypeFromSchema(node.content?._meta?.schema);
            if (!type) {
                return null;
            }

            // if (node.content?.menu?.hidden) {
            if (!node.content?.active) {
                return null;
            }

            switch (type) {
                case 'category':
                    // let category = categoriesBySlug[node.content._meta.deliveryKey.replace(`category/`, '')] || categoriesBySlug[node.content.name]
                    let category = categoriesById[node.content.name]
                    return buildCategoryItem(node, category);
                case 'group':
                    return buildGroupItem(node);
                case 'page':
                    return buildPageItem(node);
                case 'external-page':
                    return buildExternalPageItem(node);
            }

            return null;
        };

        const buildCmsEntries = (children: CmsHierarchyNode[] = []): NavigationItem[] => {
            // sort by priority
            children.sort(function(a: any, b: any) {
                const priorityA = a.menu?.priority || a.priority || a.title;
                const priorityB = b.menu?.priority || b.priority || b.title;

                if (priorityA < priorityB) {    
                    return 1;    
                } else if (priorityA > priorityB) {    
                    return -1;    
                }    
                return 0;    
            });
            return children.map(buildCmsItem).filter(x => x != null) as NavigationItem[];
        }

        enrichCmsEntries(pages, categoriesById, categories);

        const rootEntries = buildCmsEntries(pages.children);
        rootEntries.forEach(rootEntry => {
            walkNavigation(rootEntry, (node: NavigationItem, parents: NavigationItem[]) => {
                node.parents = parents;
            });
        })
        return rootEntries as NavigationItem[];

    }, [pages, categories, categoriesBySlug, categoriesById, language]);

    const findByHref = (href: string) => {
        let result: NavigationItem | undefined;

        for (let rootItem of rootItems) {
            walkNavigation(rootItem, (node: NavigationItem, parents: NavigationItem[]) => {
                if (`${node.href}` === href) {
                    result = node;
                }
            });
            if (result) {
                break;
            }
        }

        return result;
    }
    
    return <NavigationContext.Provider value={{
        rootItems,
        findByHref
    }}>
        {children}
    </NavigationContext.Provider>;
}

export function useNavigation(): NavigationState {
    return useContext(NavigationContext) as NavigationState;
}