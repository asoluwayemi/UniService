package com.uniservice.core.common;

/** Projection for "group by" queries: a label and how many rows carry it. */
public interface LabelCount {
    String getLabel();

    long getTotal();
}
