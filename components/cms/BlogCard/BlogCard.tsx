import React from 'react';
import { CmsContent } from '@lib/cms/CmsContent';
import clsx from 'clsx';
import Image from '../../cms-modern/Image';
import camelCase from 'lodash/camelCase';
import Link from 'next/link';

type BlogCardProps = {} & CmsContent;

const BlogCard = ({
    viewType,
    title,
    blogdate,
    description,
    author,
    image,
    category = [],
    keywords = [],
    _meta,
}: BlogCardProps) => {
    return (
        <div className={clsx('amp-dc-blog-card', 'amp-dc-snippet', 'js_dc_snippet')}>
            <Link passHref href={`/blog/post/${_meta?.deliveryKey}/${camelCase(title)}`}>
                {image ? (
                    <div className="amp-dc-image">
                        <Image alt={title} imageAltText={image.imageAltText ? image.imageAltText : title} {...image} />
                    </div>
                ) : null}

                <div className="amp-dc-category-container">
                    {category.map((item: any, index: number) => {
                        return (
                            <div key={index}>
                                <div className="amp-dc-category">{item}</div>
                                <span className="line"></span>
                            </div>
                        );
                    })}
                </div>
                <div className="amp-dc-blog-card-text-wrap">
                    {title && <div className="amp-dc-title">{title}</div>}
                    {blogdate && <div className="amp-dc-blogdate">{blogdate}</div>}
                    {description && <div className="amp-dc-description">{description}</div>}
                    {viewType !== 'list' ? (
                        <>
                            {author && <div className="amp-dc-author">@{author}</div>}

                            <div className="amp-dc-keywords-container">
                                {keywords.map((keyword: any) => (
                                    <div key={keyword} className="amp-dc-keyword">
                                        {keyword}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="amp-dc-card-link">Read More</div>
                        </>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default BlogCard;
