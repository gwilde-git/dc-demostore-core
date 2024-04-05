import React, { useEffect, useState } from 'react';
import { CarouselProvider, Dot, Slider as PureSlider, Slide } from 'pure-react-carousel';
import SliderNextButton from '@components/cms-modern/Slider/SliderNextButton';
import SliderBackButton from '@components/cms-modern/Slider/SliderBackButton';
import { Box } from '@mui/material';
import { useCmsContext } from '@lib/cms/CmsContext';
import { commerceApi } from '@pages/api';
import CuratedProductGridCard from './CuratedProductGridCard';
import { useUserContext } from '@lib/user/UserContext';
import _ from 'lodash';
import { CommerceAPI, Product } from '@amplience/dc-integration-middleware';

interface Props {
    header: string;
    products: any[];
    navigationDots?: any;
}

const CuratedProductGrid = ({ header, products = [], navigationDots, ...other }: Props) => {
    const { locale: cmsLocale } = useCmsContext() || {};
    let locale = cmsLocale || 'en';
    if (locale.indexOf('-') > 0) {
        locale = locale.split('-')[0];
    }
    const [productList, setProductList] = useState<Product[]>([]);
    const cmsContext = useCmsContext();
    const userContext = useUserContext();

    useEffect(() => {
        let isMounted: boolean = true;
        if (products && products?.length) {
            (commerceApi as CommerceAPI)
                .getProducts({ productIds: products.join(','), ...cmsContext, ...userContext })
                .then((prods: Product[]) => {
                    if (isMounted) {
                        // reorder based on the original ordering because these are not ordered
                        let orderedProducts: Product[] = [];
                        _.each(products, (product) => {
                            let ordered: any = _.find(prods, (prod) => prod?.id === product);
                            if (ordered) {
                                orderedProducts.push(ordered);
                            }
                        });
                        setProductList(orderedProducts);
                    }
                });
        }
        return () => {
            isMounted = false;
        };
    }, [products, cmsContext, userContext]);

    return (
        <Box>
            <CarouselProvider
                naturalSlideWidth={100}
                naturalSlideHeight={150}
                visibleSlides={3}
                totalSlides={productList.length}
                infinite={true}
                isPlaying={false}
            >
                <PureSlider>
                    {productList.map((slide: any, index: number) => {
                        return (
                            <Slide key={index} index={index}>
                                <CuratedProductGridCard data={slide} />
                            </Slide>
                        );
                    })}
                </PureSlider>
                <SliderBackButton />
                <SliderNextButton />
                <Box style={{ textAlign: 'center', paddingTop: 15, paddingBottom: 30 }}>
                    {navigationDots &&
                        productList.map((slide: any, index: number) => {
                            return (
                                <Dot
                                    key={index}
                                    slide={index}
                                    style={{
                                        backgroundColor: '#ccc',
                                        overflow: 'hidden',
                                        border: 0,
                                        marginRight: 15,
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                    }}
                                ></Dot>
                            );
                        })}
                </Box>
            </CarouselProvider>
        </Box>
    );
};

export default CuratedProductGrid;
